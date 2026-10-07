"use client";

/** Last-resort error screen if the whole layout fails. Plain styles: the main stylesheet may not have loaded. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#3c0e18", background: "#fff" }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "96px 20px", display: "grid", gap: 16 }}>
          <h1 style={{ fontWeight: 400, fontSize: 36, margin: 0 }}>Something went wrong on our side.</h1>
          <p style={{ margin: 0, color: "#6e4a53" }}>Please try again in a moment, or message us on Instagram @nuriya.eg.</p>
          <button
            type="button"
            onClick={reset}
            style={{ justifySelf: "start", minHeight: 48, padding: "0 24px", borderRadius: 8, border: 0, background: "#3c0e18", color: "#fff", font: "inherit", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
