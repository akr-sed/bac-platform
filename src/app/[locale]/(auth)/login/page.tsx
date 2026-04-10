import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
    </main>
  );
}
