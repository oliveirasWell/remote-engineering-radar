BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS kind text DEFAULT 'product' NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS geographies jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS countries jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS role_focus jsonb DEFAULT '[]'::jsonb NOT NULL;
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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs, public.data_migrations, public.ats_boards FROM anon;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM anon;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs, public.data_migrations, public.ats_boards FROM authenticated;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM authenticated;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        END IF;
    END IF;
END
$$;

COMMIT;
