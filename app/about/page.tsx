import type { Metadata } from 'next';
import { messagesFor } from '@/lib/i18n/messages';
import { AboutContent } from './about-content';

export const metadata: Metadata = {
  title: messagesFor().navigation.about,
  description: messagesFor().about.introduction,
};

const AboutPage = () => <AboutContent />;

export default AboutPage;
