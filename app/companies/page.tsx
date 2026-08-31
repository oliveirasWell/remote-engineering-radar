import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const CompaniesPage = () => {
  redirect('/');
};

export default CompaniesPage;
