'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotifPrefs {
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  weeklyDigest: boolean;
  marketing: boolean;
}

const DEFAULTS: NotifPrefs = {
  likes: true,
  comments: true,
  mentions: true,
  weeklyDigest: true,
  marketing: false,
};

function Toggle({
  checked,
  onChange,
  label,
  htmlFor,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#BBC8D4] bg-[#F9FBFD] px-4 py-3"
    >
      <span className="text-sm font-medium text-[#25313C]">{label}</span>
      <button
        id={htmlFor}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0095D1] focus-visible:ring-offset-2 ${
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

export function NotificationsSection() {
  const t = useTranslations('settings.notificationsSection');
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function set<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPrefs: prefs }),
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
        <Toggle htmlFor="notif-likes" checked={prefs.likes} onChange={(v) => set('likes', v)} label={t('likes')} />
        <Toggle htmlFor="notif-comments" checked={prefs.comments} onChange={(v) => set('comments', v)} label={t('comments')} />
        <Toggle htmlFor="notif-mentions" checked={prefs.mentions} onChange={(v) => set('mentions', v)} label={t('mentions')} />
        <Toggle htmlFor="notif-digest" checked={prefs.weeklyDigest} onChange={(v) => set('weeklyDigest', v)} label={t('weeklyDigest')} />
        <Toggle htmlFor="notif-marketing" checked={prefs.marketing} onChange={(v) => set('marketing', v)} label={t('marketing')} />
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
