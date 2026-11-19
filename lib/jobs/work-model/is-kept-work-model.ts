import { REMOTE_POLICY_REMOTE } from '../constants';

const BRAZIL_COUNTRY = 'brazil';
const NON_REMOTE_POLICIES_KEPT_IN_BRAZIL: ReadonlySet<string> = new Set([
  'hybrid',
  'onsite',
]);

/**
 * Remote roles anywhere; hybrid and on-site roles only in Brazil, where the
 * target companies hire that way (SPEC-037). The ingest stores only these,
 * and the job detail page opens only these.
 */
export const isKeptWorkModel = (
  remotePolicy: string | null | undefined,
  countries: readonly string[],
): boolean =>
  remotePolicy === REMOTE_POLICY_REMOTE ||
  (NON_REMOTE_POLICIES_KEPT_IN_BRAZIL.has(remotePolicy ?? '') &&
    countries.includes(BRAZIL_COUNTRY));
