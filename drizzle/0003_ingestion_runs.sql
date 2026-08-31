CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"persisted_jobs" integer DEFAULT 0 NOT NULL,
	"companies_updated" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ingestion_runs_completed_at_idx" ON "ingestion_runs" USING btree ("completed_at");--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
		REVOKE ALL PRIVILEGES ON TABLE "ingestion_runs" FROM anon;
	END IF;

	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
		REVOKE ALL PRIVILEGES ON TABLE "ingestion_runs" FROM authenticated;
	END IF;
END
$$;