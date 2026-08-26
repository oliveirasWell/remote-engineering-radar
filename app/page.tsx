import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { APP_NAME, UPDATED_PLACEHOLDER } from './constants';

const Home = () => {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-3 px-6 py-16">
      <PageTitle as="h1" className="text-4xl tracking-tight">
        {APP_NAME}
      </PageTitle>
      <p className="text-muted">{UPDATED_PLACEHOLDER}</p>
    </main>
  );
};

export default Home;
