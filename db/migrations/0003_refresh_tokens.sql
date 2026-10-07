-- One-time page-refresh tokens. A trusted job that can write to the database (the "Admin tasks"
-- workflow) inserts a random token, then calls POST /api/revalidate with it. The site accepts a
-- token only once and only for 10 minutes. No shared secret has to leave Vercel.
CREATE TABLE refresh_tokens (
  token       text PRIMARY KEY CHECK (length(token) >= 32),
  created_at  timestamptz NOT NULL DEFAULT now()
);
