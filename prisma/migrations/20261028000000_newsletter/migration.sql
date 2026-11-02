CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
    "email" TEXT NOT NULL,
    "focus" TEXT,
    "country" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "pending_focus" TEXT,
    "pending_country" TEXT,
    "pending_locale" TEXT,
    "token_hash" TEXT,
    "token_issued_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("email")
);
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriptions_token_hash_unique" ON "newsletter_subscriptions"("token_hash");
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_confirmed_at_idx" ON "newsletter_subscriptions"("confirmed_at");
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_token_issued_at_idx" ON "newsletter_subscriptions"("token_issued_at");

CREATE TABLE IF NOT EXISTS "newsletter_dispatches" (
    "date" TEXT NOT NULL,
    "broadcast_id" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "newsletter_dispatches_pkey" PRIMARY KEY ("date")
);

-- The application accesses these through Prisma on the server, never the Data API.
ALTER TABLE "newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "newsletter_dispatches" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE "newsletter_subscriptions", "newsletter_dispatches" FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE "newsletter_subscriptions", "newsletter_dispatches" FROM authenticated;
    END IF;
END
$$;
