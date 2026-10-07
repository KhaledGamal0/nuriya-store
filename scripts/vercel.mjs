// Vercel helper for the Production setup workflow. Needs VERCEL_TOKEN and the values exported by neon.mjs.
// Sets the site's environment variables (secret values stored as "sensitive": nobody can read them back),
// starts a production deployment from main, waits for it, then checks /api/health on the live site.
import { randomBytes } from "node:crypto";

const TOKEN = process.env.VERCEL_TOKEN?.trim();
const PROJECT = process.env.VERCEL_PROJECT || "nuriya-store";
const SITE = process.env.SITE_URL || "https://nuriya-store.vercel.app";
const note = (m) => console.log(`::notice::${m}`);
const fail = (m) => {
  console.log(`::error::${m}`);
  process.exit(1);
};
if (!TOKEN) fail("VERCEL_TOKEN secret is not set");
for (const k of ["DATABASE_URL_POOLED", "PREVIEW_DATABASE_URL_POOLED"]) if (!process.env[k]) fail(`${k} missing (the Neon step did not run)`);

let team = "";
async function vercel(path, init = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.vercel.com${path}${team ? `${sep}teamId=${team}` : ""}`, {
    ...init,
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) fail("Vercel refused VERCEL_TOKEN (401). Create a new token in Vercel → Account settings → Tokens and update the GitHub secret.");
  if (!res.ok) {
    const err = new Error(`Vercel ${init.method ?? "GET"} ${path.split("?")[0]} → ${res.status} ${body.error?.message ?? ""}`.trim());
    err.status = res.status;
    throw err;
  }
  return body;
}

async function findProject() {
  try {
    return await vercel(`/v9/projects/${PROJECT}`);
  } catch (e) {
    if (e.status !== 404 && e.status !== 403) throw e;
  }
  const { teams = [] } = await vercel("/v2/teams");
  for (const t of teams) {
    team = t.id;
    try {
      return await vercel(`/v9/projects/${PROJECT}`);
    } catch {}
  }
  team = "";
  fail(`Vercel project "${PROJECT}" not found with this token. Check the token's scope includes the account that owns the project.`);
}

try {
  const project = await findProject();
  note(`Vercel project "${project.name}" found.`);

  // Replace any earlier values of the variables we manage, so there is exactly one of each.
  // Optional: order e-mail settings, copied only when the GitHub secrets exist (production only,
  // so test orders on preview deployments never e-mail the shop).
  const optional = ["RESEND_API_KEY", "ORDER_ALERT_EMAIL"].filter((k) => process.env[k]?.trim());
  const managed = ["DATABASE_URL", "REVALIDATE_SECRET", "NEXT_PUBLIC_SITE_URL", ...optional];
  const { envs = [] } = await vercel(`/v9/projects/${project.id}/env`);
  for (const e of envs.filter((e) => managed.includes(e.key))) await vercel(`/v9/projects/${project.id}/env/${e.id}`, { method: "DELETE" });

  const revalidate = randomBytes(32).toString("base64url");
  console.log(`::add-mask::${revalidate}`);
  await vercel(`/v10/projects/${project.id}/env`, {
    method: "POST",
    body: JSON.stringify([
      { key: "DATABASE_URL", value: process.env.DATABASE_URL_POOLED, type: "sensitive", target: ["production"], comment: "Neon pooled, production branch" },
      { key: "DATABASE_URL", value: process.env.PREVIEW_DATABASE_URL_POOLED, type: "sensitive", target: ["preview"], comment: "Neon pooled, preview branch (test data only)" },
      { key: "REVALIDATE_SECRET", value: revalidate, type: "sensitive", target: ["production", "preview"] },
      { key: "NEXT_PUBLIC_SITE_URL", value: SITE, type: "plain", target: ["production", "preview"] },
      ...optional.map((key) => ({ key, value: process.env[key].trim(), type: "sensitive", target: ["production"] })),
    ]),
  });
  note(`Vercel variables set: DATABASE_URL (production → Neon production, preview → Neon preview), REVALIDATE_SECRET, NEXT_PUBLIC_SITE_URL${optional.length ? ", " + optional.join(", ") : ""}.`);
  if (optional.length < 2) note("Order e-mails are not configured yet (RESEND_API_KEY and ORDER_ALERT_EMAIL secrets). Orders are still saved; the hourly Order watch alerts you.");

  const repoId = process.env.GITHUB_REPOSITORY_ID;
  const dep = await vercel(`/v13/deployments?forceNew=1&skipAutoDetectionConfirmation=1`, {
    method: "POST",
    body: JSON.stringify({ name: project.name, project: project.id, target: "production", gitSource: { type: "github", ref: "main", repoId } }),
  });
  note("Production deployment started from main.");
  let state = dep.readyState;
  for (let i = 0; i < 60 && !["READY", "ERROR", "CANCELED"].includes(state); i++) {
    await new Promise((r) => setTimeout(r, 10000));
    state = (await vercel(`/v13/deployments/${dep.id}`)).readyState;
  }
  if (state !== "READY") fail(`Deployment ended as ${state}. The previous version stays live. Open Vercel → Deployments for the build log.`);
  note("Deployment is live.");

  await new Promise((r) => setTimeout(r, 5000));
  const res = await fetch(`${SITE}/api/health`, { cache: "no-store" });
  const health = await res.json().catch(() => ({}));
  note(`Live health: ${JSON.stringify(health)}`);
  if (health.database !== "connected" || !health.seeded) fail("Live site is not reading the database yet. See the health line above.");
  note(`Done: the live site reads products and delivery fees from the Neon database in Frankfurt. Order e-mails: ${health.email ?? "unknown"}.`);
} catch (e) {
  fail(String(e.message ?? e));
}
