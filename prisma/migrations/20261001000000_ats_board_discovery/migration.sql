ALTER TABLE "companies" ADD COLUMN "board_checked_at" TIMESTAMPTZ;

CREATE TABLE "ats_boards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ats" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company_id" UUID NOT NULL,
    CONSTRAINT "ats_boards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ats_boards_ats_slug_unique" UNIQUE ("ats", "slug"),
    CONSTRAINT "ats_boards_ats_check" CHECK ("ats" IN ('greenhouse', 'ashby', 'lever'))
);

CREATE INDEX "ats_boards_company_id_idx" ON "ats_boards"("company_id");

ALTER TABLE "ats_boards" ADD CONSTRAINT "ats_boards_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ats_boards" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE "ats_boards" FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE "ats_boards" FROM authenticated;
    END IF;
END
$$;
