import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">{t('welcome')}</h1>
    </main>
  );
}
