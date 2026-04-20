import { Link } from '@/i18n/routing';
import { Compass } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function SubjectPrompt() {
  const t = await getTranslations('dashboard');
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
      <Compass className="mb-3 size-10 text-muted-foreground" />
      <p className="mb-2 font-semibold">{t('emptyTitle')}</p>
      <p className="mb-4 text-sm text-muted-foreground">{t('emptyDescription')}</p>
      <Link
        href="/profile"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        {t('pickSubjects')}
      </Link>
    </div>
  );
}
