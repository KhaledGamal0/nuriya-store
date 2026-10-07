/**
 * The shop's public address. On Vercel production it is read from the project's own production domain
 * (VERCEL_PROJECT_PRODUCTION_URL, e.g. nuriya.app), so connecting or changing a domain needs no setting.
 * Elsewhere (previews, CI, local) it is NEXT_PUBLIC_SITE_URL, or localhost.
 */
export function siteUrl(): string {
  const prodDomain = process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : undefined;
  const url = prodDomain ? `https://${prodDomain}` : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}
