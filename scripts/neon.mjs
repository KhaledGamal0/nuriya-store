// Neon helper for GitHub Actions. Needs NEON_API_KEY. Never prints a password or connection string:
// every secret value is masked (::add-mask::) before it goes anywhere, and only written to $GITHUB_ENV.
//
//   node scripts/neon.mjs setup                 find or create the Frankfurt project + "preview" branch,
//                                               export DATABASE_URL (direct) and *_POOLED / PREVIEW_* values
//   node scripts/neon.mjs env production|preview export DATABASE_URL (direct) for that branch
import { appendFileSync } from "node:fs";

const API = "https://console.neon.tech/api/v2";
const REGION = "aws-eu-central-1"; // Frankfurt — closest Neon region to Cairo; cannot be changed later
const NEW_NAME = "nuriya-store";
const KEY = process.env.NEON_API_KEY?.trim();

const note = (msg) => console.log(`::notice::${msg}`);
const fail = (msg) => {
  console.log(`::error::${msg}`);
  process.exit(1);
};
if (!KEY) fail("NEON_API_KEY secret is not set");

async function neon(path, init = {}, tries = 6) {
  for (let i = 1; ; i++) {
    const res = await fetch(API + path, {
      ...init,
      headers: { authorization: `Bearer ${KEY}`, accept: "application/json", "content-type": "application/json", ...init.headers },
    });
    // 423 = project busy with another operation (normal right after creating it); retry calmly.
    if ((res.status === 423 || res.status === 429 || res.status >= 500) && i < tries) {
      await new Promise((r) => setTimeout(r, 2000 * i));
      continue;
    }
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) fail("Neon refused NEON_API_KEY (401). The key is revoked, incomplete, or not the one shown when it was created. Create a new key in Neon → Account settings → API keys and update the GitHub secret.");
    if (!res.ok) {
      const err = new Error(`Neon ${init.method ?? "GET"} ${path.split("?")[0]} → ${res.status} ${body.message ?? ""}`.trim());
      err.status = res.status;
      throw err;
    }
    return body;
  }
}

function exportSecret(name, value) {
  const pw = (() => {
    try {
      return decodeURIComponent(new URL(value).password);
    } catch {
      return "";
    }
  })();
  if (pw) console.log(`::add-mask::${pw}`);
  console.log(`::add-mask::${value}`);
  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
}

async function orgId() {
  try {
    const r = await neon("/users/me/organizations");
    const list = r.organizations ?? r.orgs ?? (Array.isArray(r) ? r : []);
    if (list.length > 1) note(`Your Neon account has ${list.length} organizations; using "${list[0].name ?? list[0].id}".`);
    return list[0]?.id;
  } catch {
    return undefined; // organization API key: the organization is implied by the key
  }
}

async function findProject(org) {
  const q = org ? `?org_id=${encodeURIComponent(org)}&limit=100` : "?limit=100";
  const { projects = [] } = await neon(`/projects${q}`);
  const ours = projects.filter((p) => /nuriya/i.test(p.name));
  const elsewhere = ours.filter((p) => p.region_id !== REGION);
  for (const p of elsewhere) note(`Neon project "${p.name}" is in ${p.region_id}, not Frankfurt; it is not used. Delete it in Neon if it is empty.`);
  const inFrankfurt = ours.filter((p) => p.region_id === REGION);
  if (inFrankfurt.length > 1) fail(`More than one Nuriya project in Frankfurt (${inFrankfurt.map((p) => p.name).join(", ")}). Keep one.`);
  return inFrankfurt[0];
}

async function createProject(org) {
  const base = { name: NEW_NAME, region_id: REGION, pg_version: 17, ...(org ? { org_id: org } : {}) };
  try {
    const r = await neon("/projects", { method: "POST", body: JSON.stringify({ project: { ...base, branch: { name: "production", database_name: "nuriya", role_name: "nuriya_owner" } } }) });
    return r.project;
  } catch (e) {
    if (e.status !== 400 && e.status !== 422) throw e;
    const r = await neon("/projects", { method: "POST", body: JSON.stringify({ project: base }) });
    return r.project;
  }
}

async function branches(projectId) {
  const { branches = [] } = await neon(`/projects/${projectId}/branches`);
  return branches;
}

async function dbAndRole(projectId, branchId) {
  const { databases = [] } = await neon(`/projects/${projectId}/branches/${branchId}/databases`);
  const db = databases.find((d) => d.name !== "postgres") ?? databases[0];
  if (!db) fail("No database found in the Neon branch");
  return { database: db.name, role: db.owner_name };
}

async function uri(projectId, branchId, pooled) {
  const { database, role } = await dbAndRole(projectId, branchId);
  const q = new URLSearchParams({ branch_id: branchId, database_name: database, role_name: role, pooled: String(pooled) });
  const r = await neon(`/projects/${projectId}/connection_uri?${q}`);
  if (!r.uri) fail("Neon did not return a connection string");
  return r.uri;
}

async function ensurePreview(projectId, prod) {
  let preview = (await branches(projectId)).find((b) => b.name === "preview");
  if (!preview) {
    const r = await neon(`/projects/${projectId}/branches`, {
      method: "POST",
      body: JSON.stringify({ branch: { name: "preview", parent_id: prod.id }, endpoints: [{ type: "read_write" }] }),
    });
    preview = r.branch;
    note('Created Neon branch "preview" (test copy for Vercel preview deployments; production orders never mix with tests).');
  }
  return preview;
}

async function locate(create) {
  const org = await orgId();
  let project = await findProject(org);
  if (!project) {
    if (!create) fail("No Nuriya Neon project in Frankfurt yet. Run the Production setup workflow first.");
    project = await createProject(org);
    note(`Created Neon project "${project.name}" in Frankfurt (Postgres 17).`);
  } else {
    note(`Using Neon project "${project.name}" in Frankfurt.`);
  }
  const all = await branches(project.id);
  const prod = all.find((b) => b.default) ?? all.find((b) => b.primary) ?? all[0];
  if (!prod) fail("The Neon project has no branches");
  return { project, prod };
}

const [cmd, which = "production"] = process.argv.slice(2);
try {
  if (cmd === "setup") {
    const { project, prod } = await locate(true);
    exportSecret("DATABASE_URL", await uri(project.id, prod.id, false));
    exportSecret("DATABASE_URL_POOLED", await uri(project.id, prod.id, true));
    const preview = await ensurePreview(project.id, prod);
    exportSecret("PREVIEW_DATABASE_URL", await uri(project.id, preview.id, false));
    exportSecret("PREVIEW_DATABASE_URL_POOLED", await uri(project.id, preview.id, true));
  } else if (cmd === "env") {
    const { project, prod } = await locate(false);
    const branch = which === "preview" ? (await branches(project.id)).find((b) => b.name === "preview") : prod;
    if (!branch) fail(`Neon branch "${which}" not found`);
    exportSecret("DATABASE_URL", await uri(project.id, branch.id, false));
  } else {
    fail("usage: neon.mjs setup | env production|preview");
  }
} catch (e) {
  fail(String(e.message ?? e));
}
