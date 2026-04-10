import { useTranslations } from 'next-intl';

export default function ExerciseDetailPage() {
  const t = useTranslations('exercises.detail');
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">{t('solutions')}</h1>
    </main>
  );
}
