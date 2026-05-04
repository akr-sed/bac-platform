import { CheckSquare, MessageCircle, BookOpen, PenLine } from 'lucide-react';

interface Quest {
  key: string;
  title: string;
  current: number;
  goal: number;
  completed: boolean;
}

interface DailyQuestsCardProps {
  quests: Quest[];
  locale: string;
}

const QUEST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'comment-3': MessageCircle,
  'solve-1': BookOpen,
  'post-1': PenLine,
};

export function DailyQuestsCard({ quests, locale }: DailyQuestsCardProps) {
  const isAr = locale === 'ar';
  const label = isAr ? 'المهمات اليومية' : 'Daily Quests';

  // Fallback placeholder quests if empty
  const displayQuests =
    quests.length > 0
      ? quests
      : [
          { key: 'comment-3', title: isAr ? 'علّق 3 مرات' : 'Comment 3 times', current: 0, goal: 3, completed: false },
          { key: 'solve-1', title: isAr ? 'حلّ تمريناً' : 'Solve 1 exercise', current: 0, goal: 1, completed: false },
          { key: 'post-1', title: isAr ? 'انشر تمريناً' : 'Post 1 exercise', current: 0, goal: 1, completed: false },
        ];

  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-[#D9EFF8] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CheckSquare className="size-[20px] text-[#0095D1]" />
        <span className="text-[18px] font-bold text-[#171C20] font-arabic">{label}</span>
      </div>

      {/* Quest list */}
      <div className="flex flex-col gap-2">
        {displayQuests.slice(0, 3).map((quest) => {
          const Icon = QUEST_ICONS[quest.key] ?? CheckSquare;
          const progressText = `${quest.current}/${quest.goal}`;
          return (
            <div
              key={quest.key}
              className="flex items-center justify-between rounded-[8px] border border-[#DFE3E8] bg-white p-[13px]"
            >
              {/* Left: progress */}
              <span
                className={`text-[12px] font-bold font-arabic ${quest.completed ? 'text-[#0095D1]' : 'text-[#3E4850]'}`}
              >
                {progressText}
              </span>
              {/* Right: title + icon */}
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#171C20] font-arabic">
                  {quest.title}
                </span>
                <Icon className="size-[12px] text-[#3E4850]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
