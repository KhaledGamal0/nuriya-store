// Sends a report e-mail from a GitHub job. With RESEND_API_KEY + ORDER_ALERT_EMAIL secrets it sends directly;
// otherwise it goes through the site (/api/report-mail) using the one-time pass in REPORT_TOKEN,
// so the Resend key only has to live in Vercel. Returns true when sent.
export async function sendReport({ kind, subject, html, text }) {
  const to = process.env.ORDER_ALERT_EMAIL;
  if (process.env.RESEND_API_KEY && to) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.ORDER_EMAIL_FROM || `Nuriya ${kind} <onboarding@resend.dev>`, to: [to], subject, html, text }),
    });
    console.log(r.ok ? "::notice::Report e-mailed." : `::warning::E-mail failed: ${r.status}`);
    return r.ok;
  }
  const token = process.env.REPORT_TOKEN;
  if (!token) {
    console.log("::warning::No e-mail route (no Resend secret and no one-time pass): report not e-mailed");
    return false;
  }
  const site = process.env.SITE || "https://nuriya.app";
  const r = await fetch(`${site}/api/report-mail`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ kind, subject, html, text }),
  }).catch(() => null);
  const ok = Boolean(r && r.ok);
  console.log(ok ? "::notice::Report e-mailed (through the site)." : `::warning::E-mail through the site failed: ${r ? r.status : "no answer"}`);
  return ok;
}
