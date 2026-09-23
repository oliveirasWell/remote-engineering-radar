-- Named TypeScript data migrations (classifyJob backfills) record here so
-- migrate-deploy runs each one once. SQL cannot run the classifier.
CREATE TABLE "data_migrations" (
    "name" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_migrations_pkey" PRIMARY KEY ("name")
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE "data_migrations" FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE "data_migrations" FROM authenticated;
    END IF;
END
$$;
