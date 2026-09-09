BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS kind text DEFAULT 'product' NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS geographies jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS countries jsonb DEFAULT '[]'::jsonb NOT NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs FROM anon;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM anon;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs FROM authenticated;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM authenticated;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        END IF;
    END IF;
END
$$;

COMMIT;
