import { getTranslations } from 'next-intl/server';
import type { SearchResultsDTO } from '@/types';
import { SearchClient } from './search-client';
import { SearchResults } from './search-results';
import { AppShell } from '@/components/layout/AppShell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return { title: t('title') };
}

async function fetchResults(q: string): Promise<SearchResultsDTO> {
  if (!q) return { exercises: [], sessions: [], profiles: [] };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const res = await fetch(
      `${baseUrl}/api/search?q=${encodeURIComponent(q)}&type=all&limit=6`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { exercises: [], sessions: [], profiles: [] };
    return res.json();
  } catch {
    return { exercises: [], sessions: [], profiles: [] };
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const results = await fetchResults(q);

  return (
    <AppShell>
    <main className="py-8 lg:py-12">
      {/* Client island: auto-focus search input, debounced navigation */}
      <SearchClient initialQ={q} />

      {/* Server-rendered results */}
      <SearchResults q={q} results={results} />
    </main>
    </AppShell>
  );
}
