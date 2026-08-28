DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE "companies", "hiring_signals", "jobs", "_prisma_migrations" FROM anon;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE "companies", "hiring_signals", "jobs", "_prisma_migrations" FROM authenticated;
        IF current_user = 'postgres' OR pg_has_role(current_user, 'postgres', 'MEMBER') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        END IF;
    END IF;
END
$$;
