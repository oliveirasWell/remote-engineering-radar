import { redirect } from 'next/navigation';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';

const CompaniesPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  redirect(localizedPath(await routeLocale(params), '/'));
};

export default CompaniesPage;
