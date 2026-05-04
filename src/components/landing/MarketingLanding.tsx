import { getTranslations } from 'next-intl/server';
import { BookOpen, Users, Sparkles } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { OwlIllustration } from '@/components/brand/OwlIllustration';
import { DashedFrame } from '@/components/brand/DashedFrame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

interface Props {
  locale: string;
}

const STEPS = [
  { key: 'step1', owl: 'empty-feed' as const },
  { key: 'step2', owl: 'empty-search' as const },
  { key: 'step3', owl: 'success' as const },
  { key: 'step4', owl: 'celebrate' as const },
] as const;

export async function MarketingLanding({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <main className="overflow-hidden">
      {/* ── 1. HERO ────────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* Left: copy */}
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BBC8D4] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#6D7D8B] backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0095D1] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#0095D1]" />
            </span>
            {t('hero.badge')}
          </div>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-sans)] text-5xl font-extrabold leading-[1.05] tracking-tight text-[#003449] lg:text-7xl">
            {t('hero.h1')}
          </h1>

          {/* Subtext */}
          <p className="max-w-xl text-base leading-relaxed text-[#6D7D8B] sm:text-lg">
            {t('hero.subtitle')}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register">
              <Button intent="primary-red" size="lg">
                {t('hero.ctaPrimary')}
              </Button>
            </Link>
            <Link href="/exercises">
              <Button intent="secondary-blue" size="lg">
                {t('hero.ctaSecondary')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: logo + dashed frame with mock card */}
        <div className="flex flex-col items-center gap-6">
          <Logo variant="vertical" size={80} />
          <DashedFrame intent="navy" className="w-full max-w-sm">
            <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="size-9 shrink-0 rounded-full bg-[#F9FBFD] ring-1 ring-[#BBC8D4]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#003449]">
                    {locale === 'ar' ? 'الأستاذ كريم بوزيد' : locale === 'fr' ? 'Prof. Karim Bouzid' : 'Karim Bouzid'}
                  </p>
                  <p className="text-xs text-[#6D7D8B]">
                    {locale === 'ar' ? 'الرياضيات · قبل ساعتين' : locale === 'fr' ? 'Mathématiques · il y a 2h' : 'Mathematics · 2h ago'}
                  </p>
                </div>
                <span className="rounded-full bg-[#F9FBFD] px-2.5 py-0.5 text-[11px] font-semibold text-[#003449] ring-1 ring-[#BBC8D4]">
                  Hard
                </span>
              </div>
              <h3 className="line-clamp-2 text-sm font-bold text-[#003449]">
                {locale === 'ar'
                  ? 'حساب نهاية دالة عند اللانهاية باستعمال قاعدة لوبيتال'
                  : locale === 'fr'
                    ? 'Limite à l\'infini avec la règle de L\'Hôpital'
                    : 'Limit at infinity using L\'Hôpital\'s rule'}
              </h3>
              <div className="flex items-center gap-4 text-xs text-[#6D7D8B]">
                <span>47 ♥</span>
                <span>8 💬</span>
              </div>
            </div>
          </DashedFrame>
        </div>
      </section>

      {/* ── 2. THREE PILLARS ──────────────────────────────────────── */}
      <section className="border-t border-[#BBC8D4] bg-[#F9FBFD]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px bg-[#BBC8D4] lg:grid-cols-3">
          {([
            { icon: BookOpen, title: t('pillars.exercises.title'), body: t('pillars.exercises.body') },
            { icon: Users,     title: t('pillars.sessions.title'),   body: t('pillars.sessions.body')   },
            { icon: Sparkles,  title: t('pillars.hints.title'),      body: t('pillars.hints.body')      },
          ] as const).map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white p-8 lg:p-10">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-[#E6F4FA]">
                <Icon className="size-5 text-[#0095D1]" />
              </div>
              <h3 className="font-extrabold text-lg text-[#003449]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6D7D8B]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. SAMPLE EXERCISE CARDS ─────────────────────────────── */}
      <section className="border-t border-[#BBC8D4] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center font-extrabold text-2xl text-[#003449]">
            {t('exercises.title')}
          </h2>
          {/* Placeholder cards — real data deferred; no DB fetch to keep page static */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} variant="flat">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-[#F9FBFD] ring-1 ring-[#BBC8D4]" aria-hidden />
                    <div className="h-3 w-28 rounded bg-[#BBC8D4]" aria-hidden />
                  </div>
                  <div className="h-4 w-full rounded bg-[#BBC8D4]/60" aria-hidden />
                  <div className="h-4 w-3/4 rounded bg-[#BBC8D4]/40" aria-hidden />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/exercises">
              <Button intent="secondary-blue">{t('exercises.cta')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ──────────────────────────────────────── */}
      <section className="border-t border-[#BBC8D4] bg-[#F9FBFD] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center font-extrabold text-2xl text-[#003449]">
            {t('howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ key, owl }, idx) => (
              <div key={key} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <OwlIllustration variant={owl} size={80} />
                  <span className="absolute -end-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[#003449] text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#003449]">
                  {t(`howItWorks.${key}.title` as 'howItWorks.step1.title')}
                </h3>
                <p className="mt-1 text-sm text-[#6D7D8B]">
                  {t(`howItWorks.${key}.body` as 'howItWorks.step1.body')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TRUST STRIP ───────────────────────────────────────── */}
      <section className="border-t border-[#BBC8D4] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            {([
              { stat: t('trust.students'),     label: t('trust.studentsLabel')     },
              { stat: t('trust.exercises'),    label: t('trust.exercisesLabel')    },
              { stat: t('trust.satisfaction'), label: t('trust.satisfactionLabel') },
            ] as const).map(({ stat, label }) => (
              <div key={label}>
                <p className="font-extrabold text-5xl text-[#003449]">{stat}</p>
                <p className="mt-2 text-sm text-[#6D7D8B]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA BAND ──────────────────────────────────────────── */}
      <section className="bg-[#003449] py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <Logo variant="mono-white" size={48} />
          <h2 className="font-extrabold text-3xl sm:text-4xl">{t('cta.h2')}</h2>
          <Link href="/register">
            <Button intent="primary-red" size="lg">{t('cta.button')}</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default MarketingLanding;
