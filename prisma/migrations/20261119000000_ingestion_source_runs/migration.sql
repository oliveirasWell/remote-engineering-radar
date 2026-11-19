CREATE TABLE IF NOT EXISTS "ingestion_source_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "eligible" INTEGER NOT NULL DEFAULT 0,
    "persisted" INTEGER NOT NULL DEFAULT 0,
    "new_jobs" INTEGER NOT NULL DEFAULT 0,
    "median_age_hours" DOUBLE PRECISION,
    "error" TEXT,
    CONSTRAINT "ingestion_source_runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ingestion_source_runs_run_id_idx" ON "ingestion_source_runs"("run_id");
CREATE INDEX IF NOT EXISTS "ingestion_source_runs_source_idx" ON "ingestion_source_runs"("source");

-- The application accesses this through Prisma on the server, never the Data API.
ALTER TABLE "ingestion_source_runs" ENABLE ROW LEVEL SECURITY;
