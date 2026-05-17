'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import type { NotificationDTO, NotificationType, NotificationTargetType } from '@/types';

// ── Relative time ──────────────────────────────────────────────────────────

function relativeTime(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round(diff / 1000);
  if (Math.abs(seconds) < 60) return rtf.format(-seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(hours / 24);
  return rtf.format(-days, 'day');
}

// ── Target route helper ────────────────────────────────────────────────────

function targetHref(targetType: NotificationTargetType, targetId: string): string {
  switch (targetType) {
    case 'exercise': return `/exercises/${targetId}`;
    case 'solution': return `/exercises/${targetId}`;
    case 'session':  return `/sessions/${targetId}`;
    default:         return '#';
  }
}

// ── Tab type mapping ───────────────────────────────────────────────────────

type Tab = 'all' | 'mentions' | 'reactions' | 'replies';

function tabToTypes(tab: Tab): NotificationType[] | null {
  if (tab === 'mentions') return ['mention'];
  if (tab === 'reactions') return ['like'];
  if (tab === 'replies') return ['reply', 'comment'];
  return null;
}

// ── Notification item ──────────────────────────────────────────────────────

function NotificationItem({
  notification,
  locale,
  onMarkRead,
}: {
  notification: NotificationDTO;
  locale: string;
  onMarkRead: (id: string) => void;
}) {
  const t = useTranslations('notifications');

  const verb = t(`verbs.${notification.type}`);
  const target = t(`targets.${notification.targetType}`);
  const href = targetHref(notification.targetType, notification.targetId);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[16px] border border-[#BBC8D4] p-4',
        'transition-colors',
        !notification.read && 'bg-[#E6F4FA]/60',
        notification.read && 'bg-white opacity-70'
      )}
      onClick={() => {
        if (!notification.read) onMarkRead(notification._id);
      }}
    >
      <UserAvatar
        src={notification.actor.avatar}
        name={notification.actor.name}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#25313C]">
          <span className="font-extrabold">{notification.actor.name}</span>
          {' '}{verb}{' '}
          <Link href={href} className="font-semibold text-[#0095D1] hover:underline">
            {target}
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-[#6D7D8B]">
          {relativeTime(notification.createdAt, locale)}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#ED2D30]" aria-label="Unread" />
      )}
    </div>
  );
}

// ── Main list component ────────────────────────────────────────────────────

export function NotificationsList() {
  const t = useTranslations('notifications');
  const [tab, setTab] = useState<Tab>('all');
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locale, setLocale] = useState('ar');

  useEffect(() => {
    // Get locale from the <html lang> attribute set by next-intl layout
    const lang = document.documentElement.lang || 'ar';
    setLocale(lang);
  }, []);

  const fetchNotifications = useCallback(async (activeTab: Tab, cursor?: string) => {
    const types = tabToTypes(activeTab);
    const params = new URLSearchParams({ limit: '20' });
    if (types && types.length === 1) params.set('type', types[0]);
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`/api/notifications?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    return data;
  }, []);

  // Initial + tab-change fetch
  useEffect(() => {
    setLoading(true);
    fetchNotifications(tab).then((data) => {
      if (!data) return;
      setNotifications(data.notifications);
      setNextCursor(data.nextCursor);
      setUnreadCount(data.unreadCount);
      setLoading(false);
    });
  }, [tab, fetchNotifications]);

  // Filter client-side for multi-type tabs (replies = reply + comment)
  const filtered = notifications.filter((n) => {
    const types = tabToTypes(tab);
    if (!types) return true;
    return types.includes(n.type);
  });

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    const data = await fetchNotifications(tab, nextCursor);
    if (data) {
      setNotifications((prev) => [...prev, ...data.notifications]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: t('tabs.all') },
    { key: 'mentions', label: t('tabs.mentions') },
    { key: 'reactions', label: t('tabs.reactions') },
    { key: 'replies', label: t('tabs.replies') },
  ];

  return (
    <div>
      {/* Tabs + Mark all */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-[12px] bg-[#F0F4F8] p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'cursor-pointer rounded-[10px] px-3 py-1.5 text-sm font-semibold transition-colors',
                tab === key
                  ? 'bg-white text-[#0095D1] shadow-sm'
                  : 'text-[#6D7D8B] hover:text-[#25313C]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer rounded-[12px] text-[#0095D1] border-[#0095D1] hover:bg-[#E6F4FA]"
            onClick={handleMarkAllRead}
          >
            {t('markAllRead')}
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-[16px] bg-[#E6F4FA] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          variant="empty-notifications"
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              locale={locale}
              onMarkRead={handleMarkRead}
            />
          ))}
          {nextCursor && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer rounded-[12px]"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? '...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
