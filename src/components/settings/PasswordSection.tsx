'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordSection() {
  const t = useTranslations('settings.passwordSection');

  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPwd !== confirm) {
      setMessage({ type: 'error', text: t('mismatch') });
      return;
    }
    if (newPwd.length < 8) {
      setMessage({ type: 'error', text: t('tooShort') });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: newPwd, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'ok', text: t('savedOk') });
        setCurrent('');
        setNewPwd('');
        setConfirm('');
      } else {
        setMessage({ type: 'error', text: data.error ?? t('saveError') });
      }
    } catch {
      setMessage({ type: 'error', text: t('saveError') });
    } finally {
      setSaving(false);
    }
  }

  const strengthOk = newPwd.length >= 8 && /[a-zA-Z]/.test(newPwd) && /\d/.test(newPwd);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#003449]">{t('title')}</h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="settings-current-pwd">{t('current')}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="settings-current-pwd"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="h-11 rounded-2xl ps-10"
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-new-pwd">{t('new')}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="settings-new-pwd"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              className="h-11 rounded-2xl ps-10"
              autoComplete="new-password"
            />
          </div>
          {newPwd.length > 0 && (
            <p className={`text-xs ${strengthOk ? 'text-green-600' : 'text-[#6D7D8B]'}`}>
              {t('hint')}{strengthOk && ' ✓'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-confirm-pwd">{t('confirm')}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="settings-confirm-pwd"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="h-11 rounded-2xl ps-10"
              autoComplete="new-password"
              aria-invalid={confirm.length > 0 && confirm !== newPwd ? true : undefined}
            />
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.type === 'ok' ? 'text-green-600' : 'text-[#ED2D30]'}`}>
            {message.text}
          </p>
        )}

        <Button
          type="submit"
          intent="primary-blue"
          size="sm"
          className="cursor-pointer"
          disabled={saving}
        >
          {saving ? <Loader2 className="size-3 animate-spin" /> : t('save')}
        </Button>
      </form>
    </section>
  );
}
