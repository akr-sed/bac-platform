'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/components/providers/AuthProvider';

export function AccountSection() {
  const t = useTranslations('settings.accountSection');
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
      }
    } catch {
      // silent — avatar upload is best-effort
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, bio, avatar: avatarUrl }),
      });
      if (res.ok) {
        setMessage({ type: 'ok', text: t('savedOk') });
        await refreshUser?.();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error ?? t('saveError') });
      }
    } catch {
      setMessage({ type: 'error', text: t('saveError') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#003449]">{t('title')}</h2>

      <form className="space-y-5" onSubmit={handleSave}>
        {/* Avatar */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <UserAvatar src={avatarUrl} name={name} size="lg" />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
              {t('changeAvatar')}
            </Button>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="settings-name">{t('name')}</Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="settings-email">{t('email')}</Label>
          <Input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="settings-bio">{t('bio')}</Label>
          <textarea
            id="settings-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('bioPlaceholder')}
            rows={3}
            className="w-full resize-none rounded-2xl border-2 border-[#BBC8D4] bg-white px-4 py-3 text-sm font-semibold text-[#003449] placeholder:text-[#BBC8D4] focus:border-[#0095D1] focus:outline-none"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${message.type === 'ok' ? 'text-green-600' : 'text-[#ED2D30]'}`}
          >
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
