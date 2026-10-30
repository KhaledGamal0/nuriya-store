-- Oct 30 2026: the reports clock recorded reports without sending them (psql output bug, fixed in reports-clock.yml).
-- Clear those records so nothing is wrongly skipped. Missed days are covered by a weekly catch-up report sent today.
DELETE FROM report_runs WHERE period >= '2026-10-28';
