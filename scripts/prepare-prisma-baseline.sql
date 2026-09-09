BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS kind text DEFAULT 'product' NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS geographies jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS countries jsonb DEFAULT '[]'::jsonb NOT NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE public.companies, public.jobs FROM authenticated;
    END IF;
END
$$;

COMMIT;
