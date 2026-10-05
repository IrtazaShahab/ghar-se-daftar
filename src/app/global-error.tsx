"use client";

/**
 * Last-resort boundary for failures in the root layout itself. It replaces the
 * whole document, so it can't use the app's components or stylesheet.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f0e4", color: "#18231b", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
        <div role="alert" style={{ maxWidth: 440, margin: 16, padding: 32, borderRadius: 24, background: "#fffaf1", border: "1px solid #e4d8c4", textAlign: "center" }}>
          <p style={{ fontWeight: 800, color: "#214f32", margin: 0 }}>Ghar Se Daftar</p>
          <h1 style={{ fontSize: 22, margin: "16px 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#687166", fontSize: 14, lineHeight: 1.6, margin: 0 }}>The site couldn&rsquo;t load right now. Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 24, height: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#214f32", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            Try again
          </button>
          {error.digest ? <p style={{ color: "#687166", fontSize: 12, marginTop: 20 }}>Reference: {error.digest}</p> : null}
        </div>
      </body>
    </html>
  );
}
