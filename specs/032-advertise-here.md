# "Advertise here" in the empty home ad slot

Amends [SPEC-028](028-compact-empty-ads.md).

## Behavior

The home placement has no AdSense slot configured, so in production it renders
nothing. Instead, an unconfigured home placement shows a small card with an
"Advertise here" `mailto:` link to `CONTACT_EMAIL`, a localized subject, and a
one-line description. Ads are negotiated manually for a fixed term; the site
does not collect payment or publish paid content automatically.

- Only the `home` placement gets the card. An unconfigured `topbar` placement
  stays absent in production, as in SPEC-028.
- A configured slot never shows the card. Its compact unfilled bar from
  SPEC-028 is unchanged; preview placeholders keep the compact bar.
- Copy lives in both catalogs: `marketing.advertiseHere`,
  `marketing.advertiseDescription`, `marketing.advertiseSubject`.

## Verification

A component test renders the unconfigured home placement in `pt-BR` and expects
the localized link with a `mailto:…?subject=` href and no AdSense `<ins>`.
