"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Shown if a page fails unexpectedly. The header, footer and bag keep working. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("page.error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="wrap done">
      <h1>Something went wrong on our side.</h1>
      <p style={{ color: "var(--ink-2)" }}>Please try again. If it keeps happening, message us on Instagram and we will help.</p>
      <div style={{ display: "flex", gap: "var(--s1)", flexWrap: "wrap" }}>
        <button type="button" className="btn" style={{ width: "auto" }} onClick={reset}>
          Try again
        </button>
        <Link className="btn btn-line" href="/">
          Back to the store
        </Link>
      </div>
    </div>
  );
}
