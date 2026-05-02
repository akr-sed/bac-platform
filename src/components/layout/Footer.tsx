import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';

export function Footer() {
  const t = useTranslations('navigation');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 space-y-4 sm:col-span-1">
            <Logo />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              منصّة الطلّاب الجزائريّين للتفوّق في امتحان البكالوريا.
            </p>
          </div>

          <FooterColumn title={t('home')}>
            <FooterLink href="/exercises">{t('exercises')}</FooterLink>
            <FooterLink href="/library">{t('library')}</FooterLink>
            <FooterLink href="/sessions">{t('sessions')}</FooterLink>
          </FooterColumn>

          <FooterColumn title="Compte">
            <FooterLink href="/login">{t('login')}</FooterLink>
            <FooterLink href="/register">{t('register')}</FooterLink>
          </FooterColumn>

          <FooterColumn title="Légal">
            <FooterLink href="/">Conditions</FooterLink>
            <FooterLink href="/">Confidentialité</FooterLink>
            <FooterLink href="/">Contact</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} Najah · مصنوع في الجزائر
          </p>
          <p className="font-mono tabular-nums">v0.1.0</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
        {title}
      </p>
      <ul className="space-y-2 text-xs">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: '/' | '/exercises' | '/library' | '/sessions' | '/login' | '/register';
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
