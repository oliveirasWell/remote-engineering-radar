import { isAuthorizedRequest } from '@/lib/api/is-authorized-request';
import { getDb } from '@/lib/db/client';
import { optInContact } from '@/lib/newsletter/opt-in-contact';
import { resendRequest, resendSegmentId } from '@/lib/newsletter/resend';
import {
  normalizeEmail,
  validEmail,
  validSubscription,
} from '@/lib/newsletter/subscription-input';

/**
 * Server-to-server subscriptions for the members area, which has already
 * verified the address through its own magic-link sign-in. Token-protected
 * like the GraphQL API; no confirmation email is sent.
 */
const unauthorized = () =>
  Response.json({ error: 'Unauthorized' }, { status: 401 });
const invalid = () =>
  Response.json({ error: 'Invalid subscription' }, { status: 400 });
const unavailable = (error: unknown) => {
  console.error(
    'Member newsletter request failed',
    error instanceof Error ? error.name : 'Error',
  );
  return Response.json({ error: 'Newsletter unavailable' }, { status: 503 });
};

export const GET = async (request: Request) => {
  if (!isAuthorizedRequest(request)) {
    return unauthorized();
  }
  const email = new URL(request.url).searchParams.get('email');
  if (!validEmail(email)) {
    return invalid();
  }
  const subscription = await getDb().newsletterSubscription.findUnique({
    where: { email: normalizeEmail(email) },
  });
  return subscription?.confirmedAt && subscription.focus
    ? Response.json({
        subscribed: true,
        focus: subscription.focus,
        country: subscription.country,
        locale: subscription.locale,
      })
    : Response.json({ subscribed: false });
};

export const PUT = async (request: Request) => {
  if (!isAuthorizedRequest(request)) {
    return unauthorized();
  }
  const input: unknown = await request.json().catch(() => null);
  if (!validSubscription(input)) {
    return invalid();
  }
  const { focus, country, locale } = input;
  const email = normalizeEmail(input.email);
  try {
    // Resend first: a failure leaves no confirmed row without a contact.
    await optInContact(email, resendSegmentId());
    const lane = { focus, country, locale, confirmedAt: new Date() };
    await getDb().newsletterSubscription.upsert({
      where: { email },
      create: { email, ...lane },
      update: {
        ...lane,
        pendingFocus: null,
        pendingCountry: null,
        pendingLocale: null,
        tokenHash: null,
      },
    });
    return Response.json({ subscribed: true, focus, country, locale });
  } catch (error) {
    return unavailable(error);
  }
};

export const DELETE = async (request: Request) => {
  if (!isAuthorizedRequest(request)) {
    return unauthorized();
  }
  const input = (await request.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  if (!validEmail(input?.email)) {
    return invalid();
  }
  const email = normalizeEmail(input.email);
  try {
    await resendRequest(`/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: { unsubscribed: true },
    });
    await getDb().newsletterSubscription.updateMany({
      where: { email },
      data: { confirmedAt: null },
    });
    return Response.json({ subscribed: false });
  } catch (error) {
    return unavailable(error);
  }
};
