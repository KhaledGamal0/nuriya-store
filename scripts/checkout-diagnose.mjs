// Read-only checkout check (Nov 22 2026): what the server saw when buyers pressed "Place order".
// Reads Vercel runtime logs (Pro keeps about 1 day) for production. Prints counts and reasons only:
// this repository is public, so never names, phones or addresses (long digit runs are masked).
const TOKEN = process.env.VERCEL_TOKEN?.trim();
if (!TOKEN) { console.log("::warning::VERCEL_TOKEN missing"); process.exit(0); }
let team = "";
const v = async (path, init) => {
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`https://api.vercel.com${path}${team ? `${sep}teamId=${team}` : ""}`, { ...init, headers: { authorization: `Bearer ${TOKEN}` } });
};
const j = async (path) => { const r = await v(path); if (!r.ok) throw new Error(`${r.status} ${path}`); return r.json(); };
let project = await j("/v9/projects/nuriya-store").catch(() => null);
if (!project) {
  const { teams = [] } = await j("/v2/teams").catch(() => ({}));
  for (const t of teams) { team = t.id; project = await j("/v9/projects/nuriya-store").catch(() => null); if (project) break; }
}
if (!project) { console.log("::warning::Vercel project not found"); process.exit(0); }
const since = Date.parse(process.env.SINCE || "2026-11-19T00:00:00Z");
const { deployments = [] } = await j(`/v6/deployments?projectId=${project.id}&target=production&limit=40&since=${since}`);
const mask = (s) => String(s ?? "").replace(/\d{7,}/g, "#######").replace(/\s+/g, " ").slice(0, 160);
const counts = new Map();
const add = (k) => counts.set(k, (counts.get(k) ?? 0) + 1);
const lines = [];
for (const d of deployments) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const r = await v(`/v1/projects/${project.id}/deployments/${d.uid}/runtime-logs`, { signal: ctrl.signal });
    if (!r.ok) { console.log(`deployment ${d.uid}: logs ${r.status}`); continue; }
    const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf("\n")) >= 0) {
        const raw = buf.slice(0, i); buf = buf.slice(i + 1); if (!raw.trim()) continue;
        let e; try { e = JSON.parse(raw); } catch { continue; }
        const path = String(e.requestPath ?? "").split("?")[0];
        const msg = String(e.message ?? "");
        const t = new Date(e.timestampInMs ?? 0).toISOString().slice(5, 16);
        if (path.startsWith("/checkout")) add(`${e.requestMethod ?? "?"} ${path} → ${e.responseStatusCode ?? "?"}`);
        if (/checkout\.|order\.|meta\.capi|Error|error/.test(msg) && !/_next\/static/.test(path)) {
          const key = msg.match(/(checkout\.[a-z_]+|order\.[a-z_.]+|meta\.capi\.[a-z]+)/)?.[1] ?? "other error";
          add(`log: ${key}`);
          if (lines.length < 60) lines.push(`${t} ${e.level ?? ""} ${path} ${mask(msg)}`);
        }
      }
    }
  } catch (err) { if (err.name !== "AbortError") console.log(`deployment ${d.uid}: ${err.message}`); }
  finally { clearTimeout(timer); }
}
console.log(`Production deployments since ${new Date(since).toISOString()}: ${deployments.length}`);
console.log("=== Counts (checkout requests and log events, last ~24 h of logs) ===");
for (const [k, n] of [...counts].sort()) console.log(`${String(n).padStart(4)}  ${k}`);
console.log("=== Log lines (masked) ===");
for (const l of lines) console.log(l);
