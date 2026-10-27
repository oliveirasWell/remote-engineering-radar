import type { Metadata } from 'next';
import { editorialFor } from '@/lib/i18n/editorial';
import { messagesFor } from '@/lib/i18n/messages';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';
import { canonicalMetadata } from '@/lib/seo/canonical-metadata/canonical-metadata';
import { GUIDE_PATH } from '@/lib/seo/constants';
import { HowItWorksContent } from './how-it-works-content';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const locale = await routeLocale(params);
  return {
    ...canonicalMetadata(GUIDE_PATH, {}, undefined, locale),
    title: messagesFor(locale).navigation.guide,
    description: editorialFor(locale).guide.introduction,
  };
};

const HowItWorksPage = () => <HowItWorksContent />;

export default HowItWorksPage;
