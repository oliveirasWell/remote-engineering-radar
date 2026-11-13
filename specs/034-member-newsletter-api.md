# Newsletter subscriptions for members-area users

## Behavior

`/api/newsletter/members` lets the members area manage the lane digest for its
signed-in users. The area has already verified the address through its own
magic-link sign-in, so there is no confirmation email.

- Auth: `Authorization: Bearer <RADAR_API_TOKEN>`, the same fail-closed check
  as the GraphQL API (moved to `lib/api/is-authorized-request.ts`).
- `GET ?email=` → `{ subscribed: false }` or
  `{ subscribed: true, focus, country, locale }`.
- `PUT { email, focus, country, locale }` → validated with the public
  signup's rules, opts the contact into the Resend segment first, then upserts
  a confirmed `newsletter_subscriptions` row and clears any pending token.
- `DELETE { email }` → marks the Resend contact unsubscribed, then clears
  `confirmedAt`.
- Contact operations need only `RESEND_API_KEY` and `RESEND_SEGMENT_ID`.
  `RESEND_FROM` is needed only to send (public confirmation emails and the
  daily broadcast). Leaving `RESEND_FROM` unset in Vercel keeps the public
  signup form hidden while members can still subscribe.

## Known debt

- `GET` reads the database only; a reader who unsubscribed through the
  broadcast's Resend link still shows as subscribed until they toggle it in the
  area.
- Without a verified Resend domain, broadcasts from `onboarding@resend.dev`
  only reach the Resend account owner.

## Verification

Route tests cover the `401` for every method, a direct subscription with no
`/emails` call, an unknown lane rejected, the status for known and unknown
addresses, and the unsubscribe order.
