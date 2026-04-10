import { useTranslations } from 'next-intl';

export default function ExercisesPage() {
  const t = useTranslations('exercises');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('browse')}</h1>
    </main>
  );
}
