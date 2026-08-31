CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website_url" TEXT,
    "logo_url" TEXT,
    "source" TEXT NOT NULL,
    "hiring_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "companies_slug_unique" UNIQUE ("slug")
);

CREATE TABLE "hiring_signals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source_url" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "detected_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "hiring_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "source_job_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "location" TEXT,
    "remote_policy" TEXT,
    "description" TEXT,
    "technologies" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "seniority" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "posted_at" TIMESTAMPTZ,
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "jobs_source_source_job_id_unique" UNIQUE ("source", "source_job_id")
);

CREATE INDEX "companies_hiring_score_updated_at_idx" ON "companies"("hiring_score", "updated_at");
CREATE INDEX "hiring_signals_company_id_idx" ON "hiring_signals"("company_id");
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");
CREATE INDEX "jobs_active_score_posted_at_idx" ON "jobs"("is_active", "score", "posted_at");

ALTER TABLE "hiring_signals"
    ADD CONSTRAINT "hiring_signals_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "jobs"
    ADD CONSTRAINT "jobs_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE "companies", "hiring_signals", "jobs" FROM anon;
        REVOKE ALL PRIVILEGES ON TABLE "_prisma_migrations" FROM anon;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE "companies", "hiring_signals", "jobs" FROM authenticated;
        REVOKE ALL PRIVILEGES ON TABLE "_prisma_migrations" FROM authenticated;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        END IF;
    END IF;
END
$$;
