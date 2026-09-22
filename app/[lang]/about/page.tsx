import type { Metadata } from 'next';
import { messagesFor } from '@/lib/i18n/messages';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';
import { canonicalMetadata } from '@/lib/seo/canonical-metadata/canonical-metadata';
import { AboutContent } from './about-content';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const locale = await routeLocale(params);
  const { navigation, about } = messagesFor(locale);
  return {
    ...canonicalMetadata('/about', {}, undefined, locale),
    title: navigation.about,
    description: about.introduction,
  };
};

const AboutPage = () => <AboutContent />;

export default AboutPage;
