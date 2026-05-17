import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/brand/Logo';
import LocaleSwitcher from './LocaleSwitcher';

// Spec §4.9 — Footer: bg-[#003449] text-white, 4-col desktop / 1-col mobile
// Footer links that don't have pages yet (About, Help, Terms, Privacy) point to
// their future routes — they'll 404 until Wave 4 creates them. This is per-spec.

type FooterHref =
  | '/'
  | '/library'
  | '/sessions'
  | '/login'
  | '/register'
  | '/about'
  | '/help'
  | '/terms'
  | '/privacy'
  | '/contact';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('navigation');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#003449] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* Grid: 4 columns on desktop, stacked + centered on mobile */}
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 sm:text-start lg:grid-cols-4">

          {/* Brand block */}
          <div className="flex flex-col items-center space-y-4 sm:col-span-2 sm:items-start lg:col-span-1">
            <Logo variant="mono-white" size="sm" />
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              {t('slogan')}
            </p>
            {/* Locale switcher inline with brand */}
            <div className="pt-2">
              <LocaleSwitcher />
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              {t('productTitle')}
            </p>
            <ul className="space-y-2 text-sm">
              <FooterLink href="/sessions">{tNav('sessions')}</FooterLink>
              <FooterLink href="/library">{tNav('library')}</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              {t('companyTitle')}
            </p>
            <ul className="space-y-2 text-sm">
              <FooterLink href="/about">{t('about')}</FooterLink>
              <FooterLink href="/help">{t('help')}</FooterLink>
              <FooterLink href="/contact">{t('contact')}</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              {t('legalTitle')}
            </p>
            <ul className="space-y-2 text-sm">
              <FooterLink href="/terms">{t('terms')}</FooterLink>
              <FooterLink href="/privacy">{t('privacy')}</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-white/40 sm:flex-row sm:items-center sm:text-start">
          <p>© {year} NAJAH · {t('madeFor')}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: FooterHref;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="inline-block py-1 text-white/70 transition-colors duration-200 hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}
