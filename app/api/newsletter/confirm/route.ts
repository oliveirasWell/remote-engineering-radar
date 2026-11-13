import { createHash } from 'node:crypto';
import { getDb } from '@/lib/db/client';
import { optInContact } from '@/lib/newsletter/opt-in-contact';
import { resendConfig } from '@/lib/newsletter/resend';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
const privateHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'none'; form-action 'self'; base-uri 'none'",
};

export const GET = async (request: Request) => {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || !tokenPattern.test(token)) {
    return new Response('Invalid confirmation link', {
      status: 400,
      headers: privateHeaders,
    });
  }
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Confirm job alert</title><main><h1>Confirm your job alert / Confirme seu alerta de vagas</h1><form method="post"><input type="hidden" name="token" value="${token}"><button type="submit">Confirmar / Confirm</button></form></main></html>`,
    {
      headers: {
        ...privateHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  );
};

export const POST = async (request: Request) => {
  const form = await request.formData();
  const token = form.get('token');
  if (typeof token !== 'string' || !tokenPattern.test(token)) {
    return new Response('Invalid confirmation link', {
      status: 400,
      headers: privateHeaders,
    });
  }
  const db = getDb();
  const subscription = await db.newsletterSubscription.findUnique({
    where: { tokenHash: tokenHash(token) },
  });
  if (
    !subscription?.tokenIssuedAt ||
    subscription.tokenIssuedAt < new Date(Date.now() - 48 * 60 * 60 * 1000) ||
    !subscription.pendingFocus
  ) {
    return new Response('Expired confirmation link', {
      status: 400,
      headers: privateHeaders,
    });
  }
  try {
    const { segmentId } = resendConfig();
    await optInContact(subscription.email, segmentId);
    await db.newsletterSubscription.updateMany({
      where: { email: subscription.email, tokenHash: subscription.tokenHash },
      data: {
        focus: subscription.pendingFocus,
        country: subscription.pendingCountry,
        locale: subscription.pendingLocale ?? 'en',
        pendingFocus: null,
        pendingCountry: null,
        pendingLocale: null,
        tokenHash: null,
        // Keep the send timestamp for the 80/day confirmation quota.
        confirmedAt: new Date(),
      },
    });
    return new Response('Subscribed! / Inscrição confirmada!', {
      headers: privateHeaders,
    });
  } catch (error) {
    console.error(
      'Newsletter opt-in failed',
      error instanceof Error ? error.name : 'Error',
    );
    return new Response('Confirmation unavailable. Try again later.', {
      status: 503,
      headers: privateHeaders,
    });
  }
};
