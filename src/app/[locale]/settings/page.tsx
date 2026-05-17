'use client';

// §W6B-T3 Settings page — 4-tab secondary nav (wireframe node 33:828)

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { User, Lock, Bell, Globe, Shield } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AccountSection } from '@/components/settings/AccountSection';
import { PasswordSection } from '@/components/settings/PasswordSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { LanguageSection } from '@/components/settings/LanguageSection';
import { PrivacySection } from '@/components/settings/PrivacySection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import { cn } from '@/lib/utils';

// ─── Tab registry ─────────────────────────────────────────────────────────────

type TabKey = 'account' | 'password' | 'preferences' | 'notifications';

interface TabConfig {
  key: TabKey;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { key: 'account', icon: User },
  { key: 'password', icon: Lock },
  { key: 'preferences', icon: Globe },
  { key: 'notifications', icon: Bell },
];

// ─── Tab content ──────────────────────────────────────────────────────────────

function AccountTabContent() {
  return (
    <div className="space-y-8">
      <AccountSection />
      {/* Danger zone de-emphasized at bottom */}
      <div className="border-t border-[#DFE3E8] pt-6">
        <DangerZoneSection />
      </div>
    </div>
  );
}

function PreferencesTabContent() {
  return (
    <div className="space-y-6">
      <LanguageSection />
      <div className="border-t border-[#DFE3E8] pt-6">
        <PrivacySection />
      </div>
    </div>
  );
}

// ─── Secondary nav item ───────────────────────────────────────────────────────

function SecondaryNavItem({
  config,
  active,
  label,
  onClick,
}: {
  config: TabConfig;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = config.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-semibold transition-colors duration-150 text-start',
        active
          ? 'bg-[#E6F4FA] text-[#0095D1]'
          : 'text-[#3E4850] hover:bg-[#E6F4FA] hover:text-[#0095D1]'
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

// ─── Mobile accordion ─────────────────────────────────────────────────────────

function MobileAccordionItem({
  config,
  open,
  label,
  onToggle,
  content,
}: {
  config: TabConfig;
  open: boolean;
  label: string;
  onToggle: () => void;
  content: React.ReactNode;
}) {
  const Icon = config.icon;
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#DFE3E8]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-[#25313C] transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <Icon className="size-4 shrink-0" />
          {label}
        </span>
        <span
          className={cn(
            'text-[#6D7D8B] transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-[#DFE3E8] px-4 py-5">{content}</div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations('settings');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active tab from URL ?tab=account|password|preferences|notifications
  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((tb) => tb.key === tabParam) ? tabParam! : 'account'
  );
  const [openAccordion, setOpenAccordion] = useState<TabKey | null>(activeTab);

  function switchTab(key: TabKey) {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function toggleAccordion(key: TabKey) {
    setOpenAccordion((prev) => (prev === key ? null : key));
  }

  function getTabContent(key: TabKey) {
    switch (key) {
      case 'account':
        return <AccountTabContent />;
      case 'password':
        return <PasswordSection />;
      case 'preferences':
        return <PreferencesTabContent />;
      case 'notifications':
        return <NotificationsSection />;
    }
  }

  return (
    <AppShell>
      <div className="py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-[24px] sm:text-[32px] font-bold text-[#171C20] font-arabic">{t('title')}</h1>
          <p className="mt-1 text-[14px] text-[#3E4850] font-arabic">{t('subtitle')}</p>
        </div>

        {/* Desktop: secondary nav (start side, next to primary nav) + content */}
        <div className="hidden gap-6 lg:flex">
          {/* Secondary nav — 240px, logical-start side (right in RTL, left in LTR)
              so it sits adjacent to the primary VerticalNavRail */}
          <nav
            className="w-60 shrink-0 space-y-1"
            aria-label={t('title')}
          >
            {TABS.map((cfg) => (
              <SecondaryNavItem
                key={cfg.key}
                config={cfg}
                active={activeTab === cfg.key}
                label={t(cfg.key)}
                onClick={() => switchTab(cfg.key)}
              />
            ))}
          </nav>

          {/* Content panel — grows */}
          <div className="min-w-0 flex-1 rounded-[12px] border border-[#DFE3E8] bg-white p-8">
            {getTabContent(activeTab)}
          </div>
        </div>

        {/* Mobile: accordion */}
        <div className="flex flex-col gap-3 lg:hidden">
          {TABS.map((cfg) => (
            <MobileAccordionItem
              key={cfg.key}
              config={cfg}
              open={openAccordion === cfg.key}
              label={t(cfg.key)}
              onToggle={() => toggleAccordion(cfg.key)}
              content={getTabContent(cfg.key)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
