'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight, BookOpen, Sparkle, Users, FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocale } from 'next-intl';

const BAC_DATE = new Date('2026-06-01T08:00:00+01:00');

function daysUntilBac(): number {
  const diff = BAC_DATE.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function Landing() {
  const nav = useTranslations('navigation');
  const { user, loading } = useAuth();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const days = daysUntilBac();

  return (
    <main className="relative overflow-hidden">
      {/* HERO — asymmetric split */}
      <section className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:py-24">
        {/* LEFT — copy block */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {isAr ? 'منصة جزائرية للبكالوريا' : 'Plateforme algérienne du baccalauréat'}
          </div>

          <h1 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {isAr ? (
              <>
                <span className="block">تمارين بكالوريا.</span>
                <span className="block text-primary">حلول جماعية.</span>
                <span className="block">جلسات مع الأساتذة.</span>
              </>
            ) : (
              <>
                <span className="block">BAC exercises.</span>
                <span className="block text-primary">Crowd solutions.</span>
                <span className="block">Live sessions.</span>
              </>
            )}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {isAr
              ? 'كلّ ما يحتاجه طالب البكالوريا الجزائري في مكان واحد. تمارين منتقاة من امتحانات حقيقية، حلول من زملاء وأساتذة معتمدين، وجلسات مباشرة لشرح الدروس الصعبة.'
              : 'Everything an Algerian BAC student needs in one place. Curated exercises from real papers, solutions from peers and verified teachers, and live sessions for the hard topics.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={user ? '/exercises' : '/register'}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'group h-12 cursor-pointer gap-2 rounded-2xl px-6 text-base font-medium transition-all duration-200 active:scale-[0.98]'
              )}
            >
              {!loading && user ? nav('exercises') : (isAr ? 'ابدأ مجّانًا' : 'Start free')}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
            <Link
              href="/library"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'lg' }),
                'h-12 cursor-pointer gap-2 rounded-2xl px-5 text-base font-medium'
              )}
            >
              <BookOpen className="size-4" />
              {isAr ? 'تصفّح بنك التمارين' : 'Browse the exercise bank'}
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="size-3.5" />
              <span className="font-mono tabular-nums text-foreground">19</span>
              <span>{isAr ? 'مستخدم نشط' : 'active members'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="size-3.5" />
              <span className="font-mono tabular-nums text-foreground">33</span>
              <span>{isAr ? 'تمرين' : 'exercises'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkle className="size-3.5" />
              <span className="font-mono tabular-nums text-foreground">9</span>
              <span>{isAr ? 'حلّاً نموذجيًا' : 'model solutions'}</span>
            </div>
          </div>
        </div>

        {/* RIGHT — kinetic countdown card */}
        <div className="relative">
          {/* Soft mesh background */}
          <div
            aria-hidden
            className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/8 via-transparent to-primary/4 blur-3xl"
          />

          <div className="relative space-y-4">
            {/* Countdown */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {isAr ? 'العدّ التنازلي للبكالوريا' : 'BAC countdown'}
              </p>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-mono text-7xl font-semibold tabular-nums tracking-tight text-foreground">
                  {days}
                </span>
                <span className="text-lg text-muted-foreground">
                  {isAr ? (days === 1 ? 'يوم' : 'يومًا') : days === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.min(100, ((365 - days) / 365) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {isAr ? 'البكالوريا — جوان 2026' : 'BAC — June 2026'}
              </p>
            </div>

            {/* Sample feed-card preview, scaled to feel like a peek */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_40px_-20px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-0.5">
              <div className="flex items-start gap-3 p-5">
                <div
                  className="size-9 shrink-0 rounded-full bg-secondary"
                  style={{
                    backgroundImage: 'url(https://i.pravatar.cc/150?img=60)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {isAr ? 'الأستاذ كريم بوزيد' : 'Karim Bouzid'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? 'الرياضيات · قبل ساعتين' : 'Mathematics · 2h ago'}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[11px] tabular-nums text-foreground">
                  Hard
                </span>
              </div>
              <div className="px-5 pb-5">
                <h3 className="line-clamp-2 font-heading text-base font-semibold text-foreground">
                  {isAr
                    ? 'حساب نهاية دالة عند اللانهاية باستعمال قاعدة لوبيتال'
                    : 'Limit at infinity using L\'Hôpital\'s rule'}
                </h3>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">47 ♥</span>
                  <span className="font-mono tabular-nums">8 💬</span>
                  <span className="ms-auto text-primary">{isAr ? 'قراءة ←' : 'Open →'}</span>
                </div>
              </div>
              {/* Subtle bottom accent */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE BAND — zigzag, two rows, no 3-card slop */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px bg-border lg:grid-cols-3">
          {[
            {
              eyebrow: isAr ? '01 — تمارين' : '01 — Exercises',
              title: isAr ? 'بنك من امتحانات حقيقية' : 'A bank of real BAC papers',
              body: isAr
                ? 'تمارين مستخرجة من بكالوريا السنوات السابقة، مرتّبة حسب السنة والمادة والمحور.'
                : 'Pulled from past BAC papers, organized by year, subject, and topic.',
              icon: BookOpen,
            },
            {
              eyebrow: isAr ? '02 — مجتمع' : '02 — Community',
              title: isAr ? 'حلول من الزملاء والأساتذة' : 'Solutions from peers and teachers',
              body: isAr
                ? 'شارك حلّك، استفد من شروح زملائك، وتحقّق من الإجابات مع الأساتذة المعتمدين.'
                : 'Post your work, learn from classmates, and get verified-teacher feedback.',
              icon: Users,
            },
            {
              eyebrow: isAr ? '03 — جلسات' : '03 — Sessions',
              title: isAr ? 'جلسات مباشرة مع الأساتذة' : 'Live sessions with teachers',
              body: isAr
                ? 'احجز جلسة جماعية لشرح موضوع صعب أو مراجعة قبل الاختبار.'
                : 'Book a live group session to revise a tough chapter before the exam.',
              icon: Sparkle,
            },
          ].map(({ eyebrow, title, body, icon: Icon }) => (
            <div key={eyebrow} className="bg-background p-8 lg:p-10">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Icon className="size-3.5 text-primary" />
                {eyebrow}
              </div>
              <h3 className="mt-6 font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-16 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {isAr ? 'البكالوريا تبدأ من هنا.' : 'Your BAC starts here.'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAr
                ? 'سجّل مجّانًا وانضم إلى أوّل دفعة من الطلّاب على المنصّة.'
                : 'Register free and join the first wave of students on the platform.'}
            </p>
          </div>
          <Link
            href={user ? '/exercises' : '/register'}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-12 cursor-pointer gap-2 rounded-2xl px-6 text-base font-medium active:scale-[0.98]'
            )}
          >
            {!loading && user ? (isAr ? 'إلى التمارين' : 'Go to exercises') : (isAr ? 'إنشاء حساب' : 'Create account')}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </main>
  );
}
