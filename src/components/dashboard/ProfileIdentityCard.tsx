'use client';

import { Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';

interface ProfileIdentityCardProps {
  name: string;
  stream?: string;
  avatar?: string | null;
}

export function ProfileIdentityCard({ name, stream, avatar }: ProfileIdentityCardProps) {
  const t = useTranslations('profileDashboard.identity');

  return (
    <div className="flex h-full min-w-0 flex-col items-center overflow-hidden rounded-[12px] border border-[#DFE3E8] bg-[#F9FBFD] p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-5">
      {/* Avatar with edit overlay */}
      <div className="relative mb-4">
        <UserAvatar src={avatar} name={name} px={96} />
        <Link
          href="/settings?tab=account"
          aria-label={t('editProfile')}
          className="absolute bottom-0 end-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#0095D1] text-white transition-colors hover:bg-[#007BB3]"
        >
          <Camera className="size-3.5" />
        </Link>
      </div>

      {/* Name */}
      <h2 className="mb-1 line-clamp-2 max-w-full text-[18px] font-bold text-[#171C20] font-arabic text-center break-words">
        {name}
      </h2>

      {/* Stream/class */}
      {stream && (
        <p className="mb-4 text-[14px] text-[#3E4850] font-arabic text-center">{stream}</p>
      )}

      {/* Edit button */}
      <Link
        href="/settings?tab=account"
        className="w-full min-h-[44px] inline-flex items-center justify-center rounded-[8px] bg-[#0095D1] px-4 py-2 text-center text-[16px] font-medium text-white transition-colors hover:bg-[#007BB3] font-arabic"
      >
        {t('editProfile')}
      </Link>
    </div>
  );
}
