-- Oct 27 2026 (Khaled): reports arrive on time in Cairo time, once each. The hourly "Reports clock" job records
-- every report it sends here (one row per report per day/week/month), so a late or repeated run never sends twice.
CREATE TABLE IF NOT EXISTS report_runs (
  kind    text NOT NULL,          -- sales-daily | sales-weekly | sales-monthly | health-daily | health-weekly
  period  text NOT NULL,          -- Cairo date the report is for, e.g. 2026-10-27
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, period)
);
-- Today's daily reports already went out this morning (old schedule): don't send them again tonight.
INSERT INTO report_runs (kind, period) VALUES ('sales-daily', '2026-10-27'), ('health-daily', '2026-10-27') ON CONFLICT DO NOTHING;
