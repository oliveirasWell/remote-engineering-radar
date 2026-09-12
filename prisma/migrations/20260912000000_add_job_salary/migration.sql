ALTER TABLE "jobs"
  ADD COLUMN "salary_min" integer,
  ADD COLUMN "salary_max" integer,
  ADD COLUMN "salary_currency" text,
  ADD COLUMN "salary_period" text;
