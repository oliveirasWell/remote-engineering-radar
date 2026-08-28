CREATE INDEX "companies_hiring_score_updated_at_idx" ON "companies" USING btree ("hiring_score","updated_at");--> statement-breakpoint
CREATE INDEX "hiring_signals_company_id_idx" ON "hiring_signals" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_company_id_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_active_score_posted_at_idx" ON "jobs" USING btree ("is_active","score","posted_at");