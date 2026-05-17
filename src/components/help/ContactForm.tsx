'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';

export function ContactForm() {
  const t = useTranslations('help.form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <EmptyState
        variant="success"
        title={t('successTitle')}
        description={t('successBody')}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#003449]">
          {t('name')}
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#003449]">
          {t('email')}
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#003449]">
          {t('message')}
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('messagePlaceholder')}
          required
          minLength={10}
          maxLength={2000}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-[#ED2D30]">{t('errorBody')}</p>
      )}

      <Button
        type="submit"
        intent="primary-blue"
        fullWidth
        loading={status === 'loading'}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
