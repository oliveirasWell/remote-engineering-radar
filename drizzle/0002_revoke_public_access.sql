DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
		REVOKE ALL PRIVILEGES ON TABLE "companies", "hiring_signals", "jobs" FROM anon;
		ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
	END IF;

	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
		REVOKE ALL PRIVILEGES ON TABLE "companies", "hiring_signals", "jobs" FROM authenticated;
		ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
	END IF;
END
$$;
