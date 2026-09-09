'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';

export const ReportLoading = ({ report }: { report: 'home' | 'jobs' }) => {
  const { messages } = useI18n();
  return (
    <p className="text-sm text-muted-foreground">{messages[report].loading}</p>
  );
};
