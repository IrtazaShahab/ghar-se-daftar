import nodemailer, { type Transporter } from "nodemailer";

/**
 * Application email (order notifications, admin alerts, corporate quotes).
 * Completely separate from Supabase Auth emails, which Supabase keeps sending
 * through its own SMTP settings. Server-only: never import from client code.
 *
 * EMAIL_PROVIDER=smtp   → SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 *                         (Gmail: smtp.gmail.com, 465, true, your address, an App Password)
 * EMAIL_PROVIDER=resend → RESEND_API_KEY
 * unset                 → emails are skipped and recorded as SKIPPED
 */

export type OutgoingEmail = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { status: "sent" } | { status: "skipped"; reason: string } | { status: "failed"; error: string };

const DEFAULT_FROM = "Ghar Se Daftar <gharsedaftar.support@gmail.com>";

function fromAddress() {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

function provider() {
  return process.env.EMAIL_PROVIDER?.trim().toLowerCase() || null;
}

type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string };

function smtpConfig(): SmtpConfig | { missing: string[] } {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  // SMTP_PASSWORD is accepted for backwards compatibility.
  const pass = process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD;
  const missing = [!host && "SMTP_HOST", !user && "SMTP_USER", !pass && "SMTP_PASS"].filter((name): name is string => Boolean(name));
  if (missing.length > 0) return { missing };

  const port = Number(process.env.SMTP_PORT || 465);
  const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();
  // 465 = implicit TLS; 587 = STARTTLS (secure=false, upgraded automatically).
  const secure = secureSetting ? secureSetting === "true" : port === 465;
  // Gmail shows app passwords with spaces; SMTP needs them without.
  return { host: host!, port, secure, user: user!, pass: pass!.replace(/\s+/g, "") };
}

let smtpTransport: Transporter | null = null;

function getSmtpTransport() {
  const config = smtpConfig();
  if ("missing" in config) return null;

  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      // Fail fast so a mail outage never holds a serverless function open.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000
    });
  }
  return smtpTransport;
}

/** Turns SMTP errors into a short, secret-free reason for logs and the Notification row. */
export function describeEmailError(error: unknown) {
  if (!(error instanceof Error)) return "Unknown email error";
  const err = error as Error & { code?: string; responseCode?: number; command?: string; rejected?: string[] };
  const code = err.code ?? "";
  const response = err.responseCode;

  let kind = "Email send failed";
  if (code === "EAUTH" || response === 535 || response === 534) {
    kind = "SMTP authentication failed (check SMTP_USER and the Gmail App Password)";
  } else if (code === "EENVELOPE" || (err.rejected && err.rejected.length > 0)) {
    kind = "Recipient address rejected";
  } else if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION" || code === "EDNS" || code === "ECONNREFUSED") {
    kind = `Could not reach the SMTP server (${code})`;
  } else if (code === "EMESSAGE" || (response && response >= 500)) {
    kind = "Message rejected by the mail server";
  } else if (response && response >= 400) {
    kind = "Mail server temporarily refused the message";
  }

  // nodemailer messages never contain the password, but strip anything URL- or credential-like anyway.
  const detail = err.message.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[email]").replace(/\S*:\/\/\S+/g, "[url]").slice(0, 200);
  return `${kind}${response ? ` [${response}]` : code ? ` [${code}]` : ""}: ${detail}`;
}

/** Why email can't be sent right now, or null when it is configured. */
export function emailConfigurationProblem() {
  const selected = provider();
  if (!selected) return "EMAIL_PROVIDER is not configured";
  if (selected === "smtp") {
    const config = smtpConfig();
    return "missing" in config ? `Missing ${config.missing.join(", ")}` : null;
  }
  if (selected === "resend") return process.env.RESEND_API_KEY?.trim() ? null : "Missing RESEND_API_KEY";
  return `Unknown EMAIL_PROVIDER "${selected}" (use "smtp" or "resend")`;
}

export function isEmailConfigured() {
  return emailConfigurationProblem() === null;
}

/** Checks the SMTP login without sending anything (used by `npm run email:test`). */
export async function verifyEmailTransport(): Promise<{ ok: true; detail: string } | { ok: false; error: string }> {
  const problem = emailConfigurationProblem();
  if (problem) return { ok: false, error: problem };
  if (provider() !== "smtp") return { ok: true, detail: "Resend is configured (no connection check available)" };

  const config = smtpConfig();
  if ("missing" in config) return { ok: false, error: `Missing ${config.missing.join(", ")}` };
  try {
    await getSmtpTransport()!.verify();
    return { ok: true, detail: `Connected and logged in to ${config.host}:${config.port} (secure=${config.secure}) as ${config.user}` };
  } catch (error) {
    return { ok: false, error: describeEmailError(error) };
  }
}

async function sendWithResend(email: OutgoingEmail, apiKey: string): Promise<SendResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress(),
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      reply_to: email.replyTo
    })
  });

  if (response.ok) return { status: "sent" };
  return { status: "failed", error: `Resend responded ${response.status}` };
}

export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const problem = emailConfigurationProblem();
  if (problem) return { status: "skipped", reason: problem };

  try {
    if (provider() === "resend") {
      return await sendWithResend(email, process.env.RESEND_API_KEY!.trim());
    }

    const info = await getSmtpTransport()!.sendMail({ from: fromAddress(), ...email });
    if (info.rejected.length > 0 && info.accepted.length === 0) {
      return { status: "failed", error: "Recipient address rejected by the mail server" };
    }
    return { status: "sent" };
  } catch (error) {
    return { status: "failed", error: describeEmailError(error) };
  }
}
