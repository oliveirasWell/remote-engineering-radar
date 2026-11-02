# SPEC-029 — No-cost Datadog GitHub integration

**Status: open — account authorization and verification pending.** This spec records
the setup; it does not connect accounts or change application telemetry.

## Goal

See repository and GitHub Actions workflow trends (especially the daily `Ingest`
workflow) in Datadog without enabling a billable product. Keep Sentry for
application/ingest errors, GA4 for traffic, and UptimeRobot for uptime.

## Scope and cost boundary

- Use Datadog's **GitHub App integration** for repository telemetry and workflow
  trends, restricted to `oliveirasWell/remote-engineering-radar`.
- No Datadog SDK, API key, CI Visibility instrumentation, APM, RUM, custom
  metrics, log/trace drains, or Vercel marketplace integration in this spec.
- Connecting the GitHub App alone does not enable billable Datadog features,
  according to [Datadog's GitHub integration docs](https://docs.datadoghq.com/integrations/github/).
  Review the account's plan and billing settings before enabling any optional
  feature; do not treat a free trial as a permanent free tier. Datadog's
  [pricing](https://www.datadoghq.com/pricing/) lists APM separately from its
  limited free infrastructure tier.
- This integration does **not** provide request traces, server performance
  profiling, or the full logs of an ingest run. Use the existing GitHub Actions
  run logs and Sentry to investigate individual failures.

## Owner setup (outside this repository)

1. With Datadog **Integrations Manage** permission and GitHub repository admin
   access, open [GitHub → Configuration in Datadog](https://app.datadoghq.com/integrations/github/configuration).
2. Select **Connect GitHub Account** → **Continue to GitHub.com**. Review the
   requested permissions and authorize the official Datadog GitHub App for
   **only** `oliveirasWell/remote-engineering-radar`.
3. In the integration's telemetry settings, select repository/workflow metrics
   only if the account confirms they do not activate a paid product. Leave CI
   Visibility, Code Security, APM, log drains, and trace drains disabled.
4. After the next scheduled `Ingest` run, check the Datadog GitHub Overview
   dashboard for this repository and its workflow trends. Confirm the account's
   billing/usage page shows no newly enabled paid product or charge.

## Acceptance / follow-up

- [ ] The GitHub integration lists only the intended repository.
- [ ] The `Ingest` workflow appears in the available repository/workflow
      telemetry; if it does not, record that limitation rather than enabling a
      paid feature to satisfy this checkbox.
- [ ] Sentry, GA4, UptimeRobot, and the current GitHub Actions alert remain
      unchanged.
- [ ] The owner verifies zero newly enabled billable products and updates this
      status with the verification date. Do not paste access tokens or API keys.

No application tests are needed for this documentation-only setup. If the
integration is not useful or billing changes, disconnect it in Datadog and
revoke its repository access in GitHub; there is no code rollback.
