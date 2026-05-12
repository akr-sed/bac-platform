export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  points: number;
  isVerifiedTeacher: boolean;
  avatar?: string | null;
  preferences?: { subjects: string[] };
  createdAt: string;
}

export interface ExerciseDTO {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  subtopic: string;
  author: UserDTO;
  attachments: string[];
  solutionCount: number;
  // Optional exam-import metadata.
  examId?: string;
  examNumber?: number;
  concepts?: string[];
  marks?: number;
  sourcePage?: number;
  figureDescriptions?: string[];
  hasMath?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamDTO {
  _id: string;
  title: string;
  year: number;
  subject: string;
  level: string;
  source: { filename: string; parsedExamId: string };
  exerciseIds: string[];
  importedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SolutionDTO {
  _id: string;
  exerciseId: string;
  author: UserDTO;
  content: string;
  images: string[];
  likes: string[];
  likesCount: number;
  commentCount: number;
  isOfficial?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  _id: string;
  solutionId: string;
  author: UserDTO;
  content: string;
  createdAt: string;
}

export interface ReportDTO {
  _id: string;
  reportedBy: UserDTO;
  targetType: 'exercise' | 'solution' | 'comment' | 'user';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CategoryDTO {
  _id: string;
  name: { en: string; fr: string; ar: string };
  type: 'subject' | 'topic' | 'subtopic';
  parentId: string | null;
  order: number;
  children?: CategoryDTO[];
}

export interface HintDTO {
  hint: string;
  disclaimer: string;
  exerciseId: string;
}

export interface DashboardDTO {
  user: UserDTO;
  stats: {
    exercisesPosted: number;
    solutionsSubmitted: number;
    commentsCount: number;
    likesReceived: number;
  };
  recentActivity: ActivityItem[];
  pointsBreakdown: {
    fromSolutions: number;
    fromComments: number;
    fromLikes: number;
  };
}

export interface ActivityItem {
  type: 'solution' | 'comment' | 'exercise';
  title: string;
  targetId: string;
  createdAt: string;
}

export interface FeedItemDTO {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  attachments: string[];
  likesCount: number;
  solutionCount: number;
  commentsCount: number;
  lastActivityAt: string;
  author: Pick<UserDTO, '_id' | 'name' | 'avatar' | 'role' | 'isVerifiedTeacher'> & {
    /**
     * Reputation points used to render the inline ReputationBadge next to the
     * author chip on cards. Optional because some Saved/Activity hydration
     * paths don't yet project the author's `points` field — the badge
     * gracefully hides itself when missing.
     */
    points?: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  hasMath?: boolean;
  featured?: boolean;
  filiere?: string;
}

export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export type SessionTeacherDTO = Pick<
  UserDTO,
  '_id' | 'name' | 'avatar' | 'role' | 'isVerifiedTeacher'
>;

export interface SessionDTO {
  _id: string;
  title: string;
  description: string;
  teacher: SessionTeacherDTO;
  subject: string;
  topics: string[];
  exerciseIds: string[];
  scheduledAt: string;
  durationMinutes: number;
  /**
   * Only present when the requester is the session's teacher or an enrolled
   * student. Hidden from anonymous / non-enrolled students.
   */
  meetingUrl?: string;
  capacity: number | null;
  priceDA: number;
  status: SessionStatus;
  enrolledCount: number;
  isEnrolled?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionEnrollmentDTO {
  _id: string;
  userId: string;
  sessionId: string;
  createdAt: string;
}

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = 'like' | 'comment' | 'mention' | 'reply' | 'follow';
export type NotificationTargetType = 'exercise' | 'solution' | 'comment' | 'session';

export interface NotificationActorDTO {
  _id: string;
  name: string;
  avatar?: string | null;
}

export interface NotificationDTO {
  _id: string;
  user: string;
  actor: NotificationActorDTO;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetId: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardUserDTO {
  id: string;
  name: string;
  avatarUrl?: string | null;
  stream?: string;
}

export interface LeaderboardEntry {
  user: LeaderboardUserDTO;
  points: number;
  rank: number;
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchResultExercise {
  _id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  author: Pick<UserDTO, '_id' | 'name' | 'avatar'>;
  createdAt: string;
}

export interface SearchResultSession {
  _id: string;
  title: string;
  description: string;
  subject: string;
  scheduledAt: string;
  status: SessionStatus;
  teacher: Pick<UserDTO, '_id' | 'name' | 'avatar'>;
}

export interface SearchResultProfile {
  _id: string;
  name: string;
  avatar?: string | null;
  role: 'student' | 'teacher' | 'admin';
  bio?: string;
}

export interface SearchResultsDTO {
  exercises: SearchResultExercise[];
  sessions: SearchResultSession[];
  profiles: SearchResultProfile[];
}

// ── Gamification (Wave 6) ─────────────────────────────────────────────────────

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDTO {
  _id: string;
  key: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
}

export interface EarnedAchievementDTO {
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  unlockedAt: string;
}

export interface DailyQuestDTO {
  _id: string;
  key: string;
  title: string;
  goal: number;
  rewardXp: number;
  current: number;
  completed: boolean;
}

export interface XPLedgerEntry {
  _id: string;
  delta: number;
  reason: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface LevelProgress {
  current: number;       // XP earned in current level
  nextThreshold: number; // XP needed for next level
  pct: number;           // 0-100
}

export interface StreakDay {
  date: string; // YYYY-MM-DD
  ok: boolean;
}

export interface GamificationSummaryDTO {
  user: {
    xp: number;
    level: number;
    levelProgress: LevelProgress;
    streakDays: number;
    streakWeek: StreakDay[];
    nationalRank: number;
  };
  badges: {
    earned: EarnedAchievementDTO[];
    lockedCount: number;
  };
  quests: {
    today: DailyQuestDTO[];
  };
  upcomingSessions: Array<{
    id: string;
    title: string;
    subject: string;
    startAt: string;
    isToday: boolean;
  }>;
}

export interface SubjectProgressDTO {
  subject: string;
  completed: number;
  total: number;
  pct: number;
}

export type ActivityKind = 'exercise-solved' | 'video-watched' | 'comment' | 'achievement';

export interface ActivityEntryDTO {
  at: string;
  kind: ActivityKind;
  title: string;
  meta?: Record<string, unknown>;
}
