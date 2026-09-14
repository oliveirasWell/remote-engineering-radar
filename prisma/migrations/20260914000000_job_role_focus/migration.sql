-- Persist the role discipline the classifier already computes, so the jobs
-- page can offer a Cloud & Ops track. Expand-only: the default keeps existing
-- rows valid, and the daily ingestion re-classifies and upserts every row.
ALTER TABLE "jobs" ADD COLUMN "role_focus" jsonb NOT NULL DEFAULT '[]';
