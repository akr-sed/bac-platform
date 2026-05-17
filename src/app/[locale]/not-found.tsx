import { EmptyState } from '@/components/ui/EmptyState';
import { getTranslations } from 'next-intl/server';

// Note: Next.js not-found files don't receive route params directly.
// We hard-code the default locale fallback here; top-level not-found.tsx handles global 404s.
export default async function LocaleNotFound() {
  // Attempt to load translations — if locale context is missing, fall back to English strings.
  let title = 'Page not found';
  let description = 'The page you are looking for does not exist.';
  let backLabel = 'Back to home';

  try {
    const t = await getTranslations('errors');
    title = t('notFound');
    description = t('pageNotFound');
    backLabel = t('backToHome');
  } catch {
    // locale context unavailable — use fallback strings above
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <EmptyState
        variant="empty-error"
        title={title}
        description={description}
        action={{ label: backLabel, href: '/ar' }}
      />
    </main>
  );
}
