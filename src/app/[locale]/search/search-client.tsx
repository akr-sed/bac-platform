'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchClient({ initialQ }: { initialQ: string }) {
  const t = useTranslations('search');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const qs = v.trim() ? `?q=${encodeURIComponent(v.trim())}` : '';
      router.push(`/search${qs}` as any);
    }, 250);
  };

  return (
    <div className="relative mb-8">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6D7D8B]" />
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={t('placeholder')}
        className="ps-10 h-12 rounded-[14px] border-[#BBC8D4] text-base"
        aria-label={t('title')}
      />
    </div>
  );
}
