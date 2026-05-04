'use client';

// §6.6 Settings page — sidebar (desktop) / accordion (mobile)

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, Lock, Bell, Globe, Shield, AlertTriangle, ChevronDown } from 'lucide-react';
import { AccountSection } from '@/components/settings/AccountSection';
import { PasswordSection } from '@/components/settings/PasswordSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { LanguageSection } from '@/components/settings/LanguageSection';
import { PrivacySection } from '@/components/settings/PrivacySection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import { cn } from '@/lib/utils';

// ─── Section registry ────────────────────────────────────────────────────────

type SectionKey = 'account' | 'password' | 'notifications' | 'language' | 'privacy' | 'dangerZone';

interface SectionConfig {
  key: SectionKey;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  danger?: boolean;
}

const SECTIONS: SectionConfig[] = [
  { key: 'account', icon: User, component: AccountSection },
  { key: 'password', icon: Lock, component: PasswordSection },
  { key: 'notifications', icon: Bell, component: NotificationsSection },
  { key: 'language', icon: Globe, component: LanguageSection },
  { key: 'privacy', icon: Shield, component: PrivacySection },
  { key: 'dangerZone', icon: AlertTriangle, component: DangerZoneSection, danger: true },
];

// ─── Desktop sidebar nav item ─────────────────────────────────────────────────

function SidebarItem({
  config,
  active,
  onClick,
  label,
}: {
  config: SectionConfig;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = config.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-150 text-start',
        active
          ? config.danger
            ? 'bg-[#FEEAEA] text-[#ED2D30]'
            : 'bg-[#E6F4FA] text-[#0095D1]'
          : config.danger
          ? 'text-[#ED2D30] hover:bg-[#FEEAEA]'
          : 'text-[#25313C] hover:bg-[#E6F4FA] hover:text-[#0095D1]'
      )}
    >
      <Icon className="size-4 flex-shrink-0" />
      {label}
    </button>
  );
}

// ─── Mobile accordion item ────────────────────────────────────────────────────

function AccordionItem({
  config,
  open,
  onToggle,
  label,
}: {
  config: SectionConfig;
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  const Icon = config.icon;
  const Component = config.component;
  return (
    <div className="rounded-2xl border border-[#BBC8D4] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-sm font-semibold transition-colors',
          config.danger ? 'text-[#ED2D30]' : 'text-[#25313C]'
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <Icon className="size-4 flex-shrink-0" />
          {label}
        </span>
        <ChevronDown
          className={cn('size-4 text-[#6D7D8B] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="border-t border-[#BBC8D4] px-4 py-5">
          <Component />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [activeSection, setActiveSection] = useState<SectionKey>('account');
  const [openAccordion, setOpenAccordion] = useState<SectionKey | null>('account');

  const ActiveComponent = SECTIONS.find((s) => s.key === activeSection)?.component ?? AccountSection;

  function toggleAccordion(key: SectionKey) {
    setOpenAccordion((prev) => (prev === key ? null : key));
  }

  return (
    <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-heading text-3xl font-semibold text-[#003449]">{t('title')}</h1>

      {/* Desktop: sidebar + panel */}
      <div className="hidden gap-8 lg:flex">
        {/* Sidebar */}
        <nav className="w-56 flex-shrink-0 space-y-1" aria-label={t('title')}>
          {SECTIONS.map((cfg) => (
            <SidebarItem
              key={cfg.key}
              config={cfg}
              active={activeSection === cfg.key}
              label={t(cfg.key)}
              onClick={() => setActiveSection(cfg.key)}
            />
          ))}
        </nav>

        {/* Content panel */}
        <div className="flex-1 rounded-3xl border border-[#BBC8D4] bg-white p-8">
          <ActiveComponent />
        </div>
      </div>

      {/* Mobile: accordion */}
      <div className="flex flex-col gap-3 lg:hidden">
        {SECTIONS.map((cfg) => (
          <AccordionItem
            key={cfg.key}
            config={cfg}
            open={openAccordion === cfg.key}
            onToggle={() => toggleAccordion(cfg.key)}
            label={t(cfg.key)}
          />
        ))}
      </div>
    </main>
  );
}
