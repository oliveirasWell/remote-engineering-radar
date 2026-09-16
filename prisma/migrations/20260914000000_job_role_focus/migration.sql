-- Persist the role discipline the classifier already computes, so the jobs
-- page can offer a Cloud & Ops track. Expand-only: the default keeps existing
-- rows valid, and the daily ingestion re-classifies and upserts every row.
-- IF NOT EXISTS because scripts/prepare-prisma-baseline.sql already carries
-- this column for pre-Prisma databases; deploy-time parity still guards the type.
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "role_focus" jsonb NOT NULL DEFAULT '[]';
