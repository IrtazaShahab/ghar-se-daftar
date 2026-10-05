import { getAppUrl } from "@/lib/app-url";

/**
 * Table-based, inline-styled layout matching supabase/templates/*.html so app
 * emails look like the existing auth emails. All dynamic text goes through
 * escapeHtml before it is placed in markup.
 */

const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SUPPORT_EMAIL = "gharsedaftar.support@gmail.com";

export function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailParagraph(text: string) {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:24px;color:#3f4a42;">${text}</p>`;
}

/** Two-column label/value rows, e.g. the totals block. */
export function emailRows(rows: Array<{ label: string; value: string; strong?: boolean; divider?: boolean }>) {
  const body = rows
    .map(({ label, value, strong, divider }) => {
      const border = divider ? "border-top:1px solid #ece3d3;" : "";
      const weight = strong ? "font-weight:700;color:#18231b;" : "color:#3f4a42;";
      return `<tr>
        <td style="padding:6px 0;${border}font-family:${FONT};font-size:14px;line-height:20px;${weight}">${label}</td>
        <td align="right" style="padding:6px 0;${border}font-family:${FONT};font-size:14px;line-height:20px;${weight}">${value}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">${body}</table>`;
}

export function emailPanel(innerHtml: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
    <tr><td style="padding:16px;background-color:#f8f2e7;border:1px solid #ece3d3;border-radius:10px;">${innerHtml}</td></tr>
  </table>`;
}

export function emailHeading(text: string) {
  return `<p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#966331;">${text}</p>`;
}

function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="margin:10px 0 0;">
    <tr><td align="center" bgcolor="#214f32" style="border-radius:10px;background-color:#214f32;">
      <a class="btn-link" href="${href}" target="_blank" style="display:inline-block;padding:14px 30px;border:1px solid #214f32;border-radius:10px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

export function renderEmailLayout({
  title,
  preheader,
  heading,
  bodyHtml,
  cta,
  footnote
}: {
  title: string;
  preheader: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footnote?: string;
}) {
  const siteUrl = getAppUrl();

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
  <style>
    @media only screen and (max-width:620px){
      .shell{width:100%!important}
      .outer{padding:20px 12px!important}
      .pad{padding-left:22px!important;padding-right:22px!important}
      .btn{width:100%!important}
      .btn-link{display:block!important;padding-left:12px!important;padding-right:12px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f6f0e4;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f0e4" style="width:100%;background-color:#f6f0e4;">
    <tr><td class="outer" align="center" style="padding:40px 12px;">
      <table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr><td style="background-color:#fffaf1;border:1px solid #e4d8c4;border-radius:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td class="pad" style="padding:26px 40px 22px;border-bottom:1px solid #ece3d3;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td width="44" height="44" valign="middle" bgcolor="#214f32" style="width:44px;height:44px;border-radius:10px;background-color:#214f32;">
                  <a href="${siteUrl}" target="_blank" style="text-decoration:none;"><img src="${siteUrl}/email/logo.png" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border:0;border-radius:10px;outline:none;text-decoration:none;"></a>
                </td>
                <td valign="middle" style="padding-left:12px;">
                  <a href="${siteUrl}" target="_blank" style="text-decoration:none;">
                    <span style="display:block;font-family:${FONT};font-size:17px;line-height:22px;font-weight:700;color:#214f32;">Ghar Se Daftar</span>
                    <span style="display:block;font-family:${FONT};font-size:12px;line-height:18px;color:#966331;">Ghar Ka Khana, Ab Daftar Tak</span>
                  </a>
                </td>
              </tr></table>
            </td></tr>
            <tr><td class="pad" style="padding:34px 40px 30px;">
              <h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:700;color:#18231b;">${escapeHtml(heading)}</h1>
              ${bodyHtml}
              ${cta ? button(escapeHtml(cta.label), cta.href) : ""}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
                <tr><td style="padding-top:20px;border-top:1px solid #ece3d3;">
                  ${footnote ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:13px;line-height:20px;color:#687166;">${footnote}</p>` : ""}
                  <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#687166;">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#214f32;text-decoration:underline;">${SUPPORT_EMAIL}</a></p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:24px 20px 0;">
          <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;font-weight:700;color:#214f32;">Ghar Se Daftar</p>
          <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:18px;color:#687166;">Fresh homemade meals, delivered to your office.</p>
          <p style="margin:0;font-family:${FONT};font-size:11px;line-height:17px;color:#8b8f86;">You&rsquo;re receiving this because of activity on your Ghar Se Daftar account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
