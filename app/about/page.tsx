import type { Metadata } from 'next';
import { messagesFor } from '@/lib/i18n/messages';
import { canonicalMetadata } from '@/lib/seo/canonical-metadata/canonical-metadata';
import { AboutContent } from './about-content';

export const metadata: Metadata = {
  ...canonicalMetadata('/about'),
  title: messagesFor().navigation.about,
  description: messagesFor().about.introduction,
};

const AboutPage = () => <AboutContent />;

export default AboutPage;
