import { CalendarDays } from 'lucide-react';

interface UpcomingSession {
  id: string;
  title: string;
  subject: string;
  startAt: string;
  isToday: boolean;
}

interface UpcomingSessionsCardProps {
  sessions: UpcomingSession[];
  locale: string;
}

function formatSessionTime(startAt: string, isToday: boolean, locale: string): string {
  const date = new Date(startAt);
  const timeStr = date.toLocaleTimeString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (locale === 'ar') {
    return isToday ? `اليوم - ${timeStr}` : `غداً - ${timeStr}`;
  }
  if (locale === 'fr') {
    return isToday ? `Aujourd'hui - ${timeStr}` : `Demain - ${timeStr}`;
  }
  return isToday ? `Today - ${timeStr}` : `Tomorrow - ${timeStr}`;
}

export function UpcomingSessionsCard({ sessions, locale }: UpcomingSessionsCardProps) {
  const isAr = locale === 'ar';
  const label = isAr ? 'الحصص القادمة' : locale === 'fr' ? 'Séances à venir' : 'Upcoming Sessions';
  const emptyLabel = isAr ? 'لا توجد حصص قادمة' : locale === 'fr' ? 'Aucune séance prévue' : 'No upcoming sessions';

  const displaySessions = sessions.slice(0, 2);

  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-[#D9EFF8] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CalendarDays className="size-[18px] text-[#0095D1]" />
        <span className="text-[18px] font-bold text-[#171C20] font-arabic">{label}</span>
      </div>

      {/* Sessions */}
      {displaySessions.length === 0 ? (
        <p className="text-center text-[12px] text-[#3E4850] font-arabic py-3">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {displaySessions.map((session, idx) => {
            const isBlue = idx === 0;
            const timeLabel = formatSessionTime(session.startAt, session.isToday, locale);

            return (
              <div
                key={session.id}
                className={[
                  'rounded-[8px] border-e-4 ps-3 pe-4 py-3',
                  idx > 0 ? 'opacity-60' : '',
                  isBlue
                    ? 'border-[#0095D1] bg-[rgba(0,98,139,0.05)]'
                    : 'border-[#894D00] bg-[rgba(137,77,0,0.05)]',
                ].join(' ')}
              >
                <p
                  className={`text-[14px] font-bold font-arabic leading-snug ${isBlue ? 'text-[#0095D1]' : 'text-[#894D00]'}`}
                >
                  {session.title}
                </p>
                <p className="mt-0.5 text-[12px] font-bold text-[#3E4850] font-arabic">
                  {timeLabel}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
