BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS kind text DEFAULT 'product' NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS geographies jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS countries jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS role_focus jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS board_checked_at timestamptz;

CREATE TABLE IF NOT EXISTS public.ats_boards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ats text NOT NULL,
    slug text NOT NULL,
    company_id uuid NOT NULL,
    CONSTRAINT ats_boards_pkey PRIMARY KEY (id),
    CONSTRAINT ats_boards_ats_slug_unique UNIQUE (ats, slug),
    CONSTRAINT ats_boards_ats_check CHECK (ats IN ('greenhouse', 'ashby', 'lever')),
    CONSTRAINT ats_boards_company_id_companies_id_fk FOREIGN KEY (company_id)
        REFERENCES public.companies(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS ats_boards_company_id_idx ON public.ats_boards(company_id);
ALTER TABLE public.ats_boards ENABLE ROW LEVEL SECURITY;

-- Created here, and revoked below with the application tables: a legacy
-- database may still carry permissive default privileges for new tables.
CREATE TABLE IF NOT EXISTS public.data_migrations (
    name text NOT NULL,
    applied_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT data_migrations_pkey PRIMARY KEY (name)
);

-- A legacy database is brought up to the current Prisma schema before its
-- historical baseline can be resolved. The matching migration is idempotent.
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    email text NOT NULL PRIMARY KEY,
    focus text,
    country text,
    locale text NOT NULL DEFAULT 'en',
    pending_focus text,
    pending_country text,
    pending_locale text,
    token_hash text,
    token_issued_at timestamptz,
    confirmed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscriptions_token_hash_unique ON public.newsletter_subscriptions(token_hash);
CREATE INDEX IF NOT EXISTS newsletter_subscriptions_confirmed_at_idx ON public.newsletter_subscriptions(confirmed_at);
CREATE INDEX IF NOT EXISTS newsletter_subscriptions_token_issued_at_idx ON public.newsletter_subscriptions(token_issued_at);
CREATE TABLE IF NOT EXISTS public.newsletter_dispatches (
    date text NOT NULL PRIMARY KEY,
    broadcast_id text NOT NULL,
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_dispatches ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.ingestion_source_runs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL,
    source text NOT NULL,
    fetched integer NOT NULL DEFAULT 0,
    eligible integer NOT NULL DEFAULT 0,
    persisted integer NOT NULL DEFAULT 0,
    new_jobs integer NOT NULL DEFAULT 0,
    median_age_hours double precision,
    error text,
    CONSTRAINT ingestion_source_runs_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS ingestion_source_runs_run_id_idx ON public.ingestion_source_runs(run_id);
CREATE INDEX IF NOT EXISTS ingestion_source_runs_source_idx ON public.ingestion_source_runs(source);
ALTER TABLE public.ingestion_source_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs, public.data_migrations, public.ats_boards, public.newsletter_subscriptions, public.newsletter_dispatches, public.ingestion_source_runs FROM anon;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM anon;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs, public.data_migrations, public.ats_boards, public.newsletter_subscriptions, public.newsletter_dispatches, public.ingestion_source_runs FROM authenticated;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM authenticated;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        END IF;
    END IF;
END
$$;

COMMIT;
