'use client';

// §6.5 Onboarding wizard — 3-step + celebrate screen

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { OwlIllustration } from '@/components/brand/OwlIllustration';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WizardData {
  stream: string;
  year: string;
  interests: string[];
}

type Step = 1 | 2 | 3 | 'done';

// ─── Step dots ───────────────────────────────────────────────────────────────

function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {([1, 2, 3] as const).map((n) => (
        <span
          key={n}
          className={cn(
            'size-2 rounded-full transition-all duration-200',
            step === n ? 'w-5 bg-[#0095D1]' : 'bg-[#BBC8D4]'
          )}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Stream ───────────────────────────────────────────────────────────

const STREAMS = [
  { key: 'sciences' },
  { key: 'math' },
  { key: 'lettres' },
  { key: 'techmath' },
  { key: 'languages' },
] as const;

function Step1({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations('onboarding');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#003449]">{t('step1Title')}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STREAMS.map(({ key }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'min-h-[64px] cursor-pointer break-words rounded-2xl border-2 px-4 py-5 text-xs font-semibold leading-tight transition-all duration-150 sm:text-sm',
              value === key
                ? 'border-[#0095D1] bg-[#E6F4FA] text-[#0095D1]'
                : 'border-[#BBC8D4] bg-white text-[#25313C] hover:border-[#0095D1] hover:bg-[#E6F4FA]'
            )}
          >
            {t(`streams.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Year ─────────────────────────────────────────────────────────────

const YEARS = ['premiere', 'terminale'] as const;

function Step2({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations('onboarding');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#003449]">{t('step2Title')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {YEARS.map((yr) => (
          <button
            key={yr}
            type="button"
            onClick={() => onChange(yr)}
            className={cn(
              'cursor-pointer rounded-2xl border-2 px-4 py-5 text-base font-semibold transition-all duration-150 sm:px-6 sm:py-6',
              value === yr
                ? 'border-[#0095D1] bg-[#E6F4FA] text-[#0095D1]'
                : 'border-[#BBC8D4] bg-white text-[#25313C] hover:border-[#0095D1] hover:bg-[#E6F4FA]'
            )}
          >
            {t(`years.${yr}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Interests ────────────────────────────────────────────────────────

const INTERESTS = [
  'math', 'physics', 'chemistry', 'biology',
  'philosophy', 'arabic', 'french', 'english',
  'history', 'geography',
] as const;

function Step3({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const t = useTranslations('onboarding');

  function toggle(interest: string) {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#003449]">{t('step3Title')}</h2>
        <p className="text-sm text-[#6D7D8B]">{t('step3Help')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((interest) => {
          const active = value.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              className={cn(
                'cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-150',
                active
                  ? 'border-[#0095D1] bg-[#0095D1] text-white'
                  : 'border-[#BBC8D4] bg-white text-[#25313C] hover:border-[#0095D1]'
              )}
            >
              {t(`interests.${interest}`)}
            </button>
          );
        })}
      </div>
      {value.length > 0 && value.length < 3 && (
        <p className="text-xs text-[#ED2D30]">
          Pick at least {3 - value.length} more
        </p>
      )}
    </div>
  );
}

// ─── Celebrate screen ─────────────────────────────────────────────────────────

function CelebrateScreen({ firstName }: { firstName: string }) {
  const t = useTranslations('onboarding');
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-4 text-center sm:gap-6">
      <OwlIllustration variant="celebrate" size={160} />
      <div>
        <h2 className="text-2xl font-extrabold text-[#003449]">
          {t('celebrate', { name: firstName })}
        </h2>
        <p className="mt-2 text-sm text-[#6D7D8B]">{t('celebrateDesc')}</p>
      </div>
      <Button
        intent="primary-red"
        size="desktop"
        className="cursor-pointer"
        onClick={() => router.push('/')}
      >
        {t('takeMeToFeed')}
      </Button>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const tFooter = useTranslations('footer');
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>({ stream: '', year: '', interests: [] });
  const [saving, setSaving] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  function canProceed() {
    if (step === 1) return data.stream !== '';
    if (step === 2) return data.year !== '';
    if (step === 3) return data.interests.length >= 3;
    return false;
  }

  async function handleNext() {
    if (step === 1) { setStep(2); return; }
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      setSaving(true);
      try {
        await fetch('/api/profile/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: {
              subjects: data.interests,
              stream: data.stream,
              year: data.year,
              interests: data.interests,
            },
            onboardedAt: new Date().toISOString(),
          }),
        });
      } catch {
        // TODO(wave5): persist onboarding state server-side — graceful failure for now
        localStorage.setItem('onboarding_complete', JSON.stringify(data));
      } finally {
        setSaving(false);
        setStep('done');
      }
    }
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)]">
      {/* Left panel */}
      <div className="hidden w-2/5 flex-col items-center justify-center gap-6 bg-[#E6F4FA] px-10 lg:flex">
        <Logo variant="vertical" size={160} priority />
        <p className="max-w-xs text-center text-sm font-medium text-[#6D7D8B]">
          {tFooter('slogan')}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-start bg-white px-4 py-8 sm:px-10 sm:py-12 lg:justify-center">
        <div className="mb-8 lg:hidden">
          <Logo variant="horizontal" size={56} />
        </div>

        <div className="w-full max-w-md space-y-8">
          {step === 'done' ? (
            <CelebrateScreen firstName={firstName} />
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#0095D1]">
                  {t('title')}
                </p>
                <StepDots step={step} />
              </div>

              <div>
                {step === 1 && (
                  <Step1
                    value={data.stream}
                    onChange={(v) => setData((d) => ({ ...d, stream: v }))}
                  />
                )}
                {step === 2 && (
                  <Step2
                    value={data.year}
                    onChange={(v) => setData((d) => ({ ...d, year: v }))}
                  />
                )}
                {step === 3 && (
                  <Step3
                    value={data.interests}
                    onChange={(v) => setData((d) => ({ ...d, interests: v }))}
                  />
                )}
              </div>

              <Button
                intent="primary-blue"
                size="desktop"
                className="w-full cursor-pointer"
                disabled={!canProceed() || saving}
                onClick={handleNext}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : step === 3 ? (
                  t('finish')
                ) : (
                  t('next')
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
