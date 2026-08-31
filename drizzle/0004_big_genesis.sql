ALTER TABLE "companies" ADD COLUMN "kind" text DEFAULT 'product' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "geographies" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
		REVOKE ALL PRIVILEGES ON TABLE "companies" FROM anon;
		REVOKE ALL PRIVILEGES ON TABLE "jobs" FROM anon;
	END IF;

	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
		REVOKE ALL PRIVILEGES ON TABLE "companies" FROM authenticated;
		REVOKE ALL PRIVILEGES ON TABLE "jobs" FROM authenticated;
	END IF;
END
$$;