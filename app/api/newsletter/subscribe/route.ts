import { randomBytes, createHash } from 'node:crypto';
import { getDb } from '@/lib/db/client';
import {
  JOB_COUNTRY_FILTER_OPTIONS,
  JOB_FOCUS_FILTER_OPTIONS,
} from '@/lib/jobs/constants';
import { resendConfig, resendRequest } from '@/lib/newsletter/resend';
import { siteOrigin } from '@/lib/seo/site-origin/site-origin';

const DAY_MS = 86_400_000;
const MAX_CONFIRMATIONS_PER_DAY = 80;
const FOCUS = new Set<string>(JOB_FOCUS_FILTER_OPTIONS.map(({ slug }) => slug));
const COUNTRY = new Set<string>(
  JOB_COUNTRY_FILTER_OPTIONS.map(({ slug }) => slug),
);
const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const validEmail = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 254 || /\s/.test(value)) {
    return false;
  }
  const parts = value.split('@');
  return (
    parts.length === 2 &&
    parts[0].length > 0 &&
    parts[1].split('.').length >= 2 &&
    parts[1].split('.').every(Boolean)
  );
};

const validSubscription = (
  input: unknown,
): input is {
  email: string;
  focus: string;
  country: string | null;
  locale: 'en' | 'pt-BR';
} => {
  if (!input || typeof input !== 'object') {
    return false;
  }
  const { email, focus, country, locale } = input as Record<string, unknown>;
  return (
    validEmail(email) &&
    typeof focus === 'string' &&
    FOCUS.has(focus) &&
    (country === null ||
      (typeof country === 'string' && COUNTRY.has(country))) &&
    (locale === 'en' || locale === 'pt-BR')
  );
};

export const POST = async (request: Request) => {
  // The browser form is same-origin. This prevents cross-site form submissions.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const input: unknown = await request.json().catch(() => null);
  if (!validSubscription(input)) {
    return Response.json({ error: 'Invalid subscription' }, { status: 400 });
  }
  if (
    process.env.VERCEL_ENV === 'preview' &&
    (!process.env.SITE_URL ||
      siteOrigin().origin !== new URL(request.url).origin)
  ) {
    // A beta confirmation link must never point to the production site.
    return Response.json(
      { error: 'Preview origin not configured' },
      { status: 503 },
    );
  }
  const { email, focus, country, locale } = input;
  const address = email.trim().toLowerCase();
  const db = getDb();
  const now = new Date();
  const since = new Date(now.getTime() - DAY_MS);
  const existing = await db.newsletterSubscription.findUnique({
    where: { email: address },
  });
  // Do not leak whether an address is already subscribed.
  if (existing?.tokenIssuedAt && existing.tokenIssuedAt > since) {
    return Response.json({ ok: true }, { status: 202 });
  }
  // ponytail: best-effort cap; use an atomic daily counter if concurrent
  // signup bursts become large enough to approach Resend's 100/day hard limit.
  if (
    (await db.newsletterSubscription.count({
      where: { tokenIssuedAt: { gte: since } },
    })) >= MAX_CONFIRMATIONS_PER_DAY
  ) {
    return Response.json(
      { error: 'Signup limit reached today' },
      { status: 429 },
    );
  }
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  try {
    resendConfig();
    await db.newsletterSubscription.upsert({
      where: { email: address },
      create: {
        email: address,
        pendingFocus: focus,
        pendingCountry: country,
        pendingLocale: locale,
        tokenHash,
        tokenIssuedAt: now,
      },
      update: {
        pendingFocus: focus,
        pendingCountry: country,
        pendingLocale: locale,
        tokenHash,
        tokenIssuedAt: now,
      },
    });
    const confirmUrl = new URL('/api/newsletter/confirm', siteOrigin());
    confirmUrl.searchParams.set('token', token);
    await resendRequest('/emails', {
      method: 'POST',
      body: {
        from: resendConfig().from,
        to: address,
        subject:
          locale === 'pt-BR'
            ? 'Confirme seu alerta de vagas'
            : 'Confirm your job alert',
        text:
          locale === 'pt-BR'
            ? `Confirme para receber as vagas da sua seleção: ${confirmUrl}\n\nSe não solicitou este alerta, ignore esta mensagem.`
            : `Confirm to receive jobs for your selection: ${confirmUrl}\n\nIf you did not request this, ignore this email.`,
      },
    });
    return Response.json({ ok: true }, { status: 202 });
  } catch (error) {
    // A failed confirmation must not block this address for another day.
    await db.newsletterSubscription
      .updateMany({
        where: { email: address, tokenHash },
        data: { tokenHash: null, tokenIssuedAt: null },
      })
      .catch(() => console.error('Newsletter confirmation cleanup failed'));
    console.error(
      'Newsletter confirmation failed',
      error instanceof Error ? error.name : 'Error',
    );
    return Response.json({ error: 'Email unavailable' }, { status: 503 });
  }
};
