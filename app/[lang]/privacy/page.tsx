import type { Metadata } from 'next';
import { editorialFor } from '@/lib/i18n/editorial';
import { messagesFor } from '@/lib/i18n/messages';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';
import { canonicalMetadata } from '@/lib/seo/canonical-metadata/canonical-metadata';
import { PRIVACY_PATH } from '@/lib/seo/constants';
import { PrivacyContent } from './privacy-content';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const locale = await routeLocale(params);
  return {
    ...canonicalMetadata(PRIVACY_PATH, {}, undefined, locale),
    title: messagesFor(locale).navigation.privacy,
    description: editorialFor(locale).privacy.introduction,
  };
};

const PrivacyPage = () => <PrivacyContent />;

export default PrivacyPage;
