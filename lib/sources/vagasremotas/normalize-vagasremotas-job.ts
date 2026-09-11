import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import { stripHtml } from '../strip-html';
import type { NormalizedJob } from '../types';
import { VAGAS_REMOTAS_SOURCE_NAME } from './constants';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() || undefined : undefined;

const readText = (value: unknown): string | undefined => {
  const text = asString(value);
  return text ? stripHtml(text) || undefined : undefined;
};

const isEnabled = (value: unknown): boolean =>
  value === true || value === 1 || value === '1';

const readPostedAt = (value: unknown): Date | undefined => {
  const date = asString(value);
  const postedAt = date ? new Date(`${date}Z`) : undefined;
  return postedAt && Number.isFinite(postedAt.getTime()) ? postedAt : undefined;
};

export const normalizeVagasRemotasJob = (
  value: unknown,
): NormalizedJob | null => {
  const record = asRecord(value);
  const meta = asRecord(record.meta);
  const title = readText(asRecord(record.title).rendered);
  const companyName = readText(meta._company_name);
  const url = asString(record.link);

  if (
    typeof record.id !== 'number' ||
    !Number.isSafeInteger(record.id) ||
    record.id <= 0 ||
    record.status !== 'publish' ||
    !isEnabled(meta._remote_position) ||
    isEnabled(meta._filled) ||
    !title ||
    !companyName ||
    !url ||
    !isSafeExternalUrl(url)
  ) {
    return null;
  }

  const websiteUrl = asString(meta._company_website);

  return {
    source: VAGAS_REMOTAS_SOURCE_NAME,
    sourceJobId: String(record.id),
    company: {
      name: companyName,
      websiteUrl: isSafeExternalUrl(websiteUrl) ? websiteUrl : undefined,
    },
    title,
    url,
    location: readText(meta._job_location),
    remotePolicy: REMOTE_POLICY_REMOTE,
    description: readText(asRecord(record.content).rendered),
    technologies: [],
    postedAt: readPostedAt(record.date_gmt),
  };
};
