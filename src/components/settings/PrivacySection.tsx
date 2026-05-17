'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Toggle({
  checked,
  onChange,
  label,
  hint,
  htmlFor,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[#BBC8D4] bg-[#F9FBFD] px-4 py-4"
    >
      <div>
        <p className="text-sm font-medium text-[#25313C]">{label}</p>
        {hint && <p className="text-xs text-[#6D7D8B]">{hint}</p>}
      </div>
      <button
        id={htmlFor}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 flex-shrink-0 relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0095D1] focus-visible:ring-offset-2 ${
          checked ? 'bg-[#0095D1]' : 'bg-[#BBC8D4]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export function PrivacySection() {
  const t = useTranslations('settings.privacySection');
  const [profilePublic, setProfilePublic] = useState(true);
  const [searchIndexing, setSearchIndexing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyPrefs: { profilePublic, searchIndexing } }),
      });
      setMessage(t('savedOk'));
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#003449]">{t('title')}</h2>

      <div className="space-y-3">
        <Toggle
          htmlFor="privacy-public"
          checked={profilePublic}
          onChange={setProfilePublic}
          label={t('profileVisibility')}
          hint={t('profileVisibilityHint')}
        />
        <Toggle
          htmlFor="privacy-search"
          checked={searchIndexing}
          onChange={setSearchIndexing}
          label={t('searchIndexing')}
          hint={t('searchIndexingHint')}
        />
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}

      <Button
        intent="primary-blue"
        size="sm"
        className="cursor-pointer"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? <Loader2 className="size-3 animate-spin" /> : t('save')}
      </Button>
    </section>
  );
}
