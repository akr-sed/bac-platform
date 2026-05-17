/**
 * Gamification helpers (Wave 6-A)
 * All functions require an active Mongoose connection (call connectToMongoDB first).
 */
import type { Types } from 'mongoose';
import { connectToDatabase } from './mongodb';

// ── XP / Level maths ─────────────────────────────────────────────────────────

/** XP required to reach the *next* level from `lvl`. */
export const XP_PER_LEVEL = (lvl: number): number => 100 * lvl;

/**
 * Cumulative XP threshold to *reach* level `lvl`.
 * Level 1 starts at 0. Level 2 needs 100. Level 3 needs 300. etc.
 */
function xpThreshold(lvl: number): number {
  // sum of XP_PER_LEVEL(1..lvl-1) = 100 * (1 + 2 + … + (lvl-1)) = 100*(lvl-1)*lvl/2
  if (lvl <= 1) return 0;
  return 100 * ((lvl - 1) * lvl) / 2;
}

/** Derive level from total XP via binary search. */
export function levelFromXp(xp: number): number {
  let lo = 1;
  let hi = 1000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (xpThreshold(mid) <= xp) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

/** Progress within the current level. */
export function xpToNextLevel(xp: number): {
  current: number;
  nextThreshold: number;
  pct: number;
} {
  const lvl = levelFromXp(xp);
  const floor = xpThreshold(lvl);
  const ceiling = xpThreshold(lvl + 1);
  const current = xp - floor;
  const nextThreshold = ceiling - floor;
  const pct = Math.min(100, Math.round((current / nextThreshold) * 100));
  return { current, nextThreshold, pct };
}

// ── Date helper ───────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Grant XP to a user, update their level, and record in XPLedger.
 *
 * Also keeps the legacy `User.points` field in sync 1:1 with `User.xp` —
 * both fields represent the same reputation concept and several UI surfaces
 * (`ReputationBadge`, `ProfileCard`, admin tables, `/api/profile/me`)
 * still read `points`. Single award path → both fields stay aligned.
 *
 * Accepts a string id (e.g. `session.userId`) or an ObjectId; Mongoose casts
 * automatically.
 */
export async function grantXp(
  userId: string | Types.ObjectId,
  delta: number,
  reason: string,
  meta?: object
): Promise<void> {
  if (!delta) return;
  await connectToDatabase();
  const User = (await import('@/models/User')).default;
  const XPLedger = (await import('@/models/XPLedger')).default;

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: delta, points: delta } },
    { new: true, select: 'xp level' }
  );
  if (!user) return;

  const newLevel = levelFromXp(user.xp ?? 0);
  if (newLevel !== (user.level ?? 1)) {
    await User.updateOne({ _id: userId }, { $set: { level: newLevel } });
  }

  await XPLedger.create({ user: userId, delta, reason, meta });
}

/**
 * Tick the streak for today.
 * - streakLastDay === yesterday → +1
 * - streakLastDay === today → no-op
 * - older or undefined → reset to 1
 */
export async function tickStreak(
  userId: Types.ObjectId,
  today: Date = new Date()
): Promise<{ streakDays: number; bumped: boolean }> {
  await connectToDatabase();
  const User = (await import('@/models/User')).default;

  const user = await User.findById(userId).select('streakDays streakLastDay');
  if (!user) return { streakDays: 0, bumped: false };

  const todayStr = toDateString(today);
  const lastDay = user.streakLastDay ? toDateString(user.streakLastDay) : null;

  if (lastDay === todayStr) {
    return { streakDays: user.streakDays ?? 0, bumped: false };
  }

  const yesterday = toDateString(
    new Date(startOfDay(today).getTime() - 24 * 60 * 60 * 1000)
  );

  let newStreak: number;
  if (lastDay === yesterday) {
    newStreak = (user.streakDays ?? 0) + 1;
  } else {
    newStreak = 1;
  }

  await User.updateOne(
    { _id: userId },
    { $set: { streakDays: newStreak, streakLastDay: startOfDay(today) } }
  );

  return { streakDays: newStreak, bumped: true };
}

/**
 * Increment today's quest progress for `key`.
 * Marks as completed when current >= goal and grants rewardXp.
 */
export async function progressQuest(
  userId: Types.ObjectId,
  key: string,
  increment = 1
): Promise<{ completed: boolean }> {
  await connectToDatabase();
  const DailyQuest = (await import('@/models/DailyQuest')).default;
  const UserQuestProgress = (await import('@/models/UserQuestProgress')).default;

  const quest = await DailyQuest.findOne({ key, active: true });
  if (!quest) return { completed: false };

  const todayStr = toDateString(new Date());

  const progress = await UserQuestProgress.findOneAndUpdate(
    { user: userId, quest: quest._id, date: todayStr },
    { $inc: { current: increment } },
    { upsert: true, new: true }
  );

  if (!progress.completed && progress.current >= quest.goal) {
    await UserQuestProgress.updateOne(
      { _id: progress._id },
      { $set: { completed: true } }
    );
    await grantXp(userId, quest.rewardXp, 'daily-quest', { questKey: key });
    return { completed: true };
  }

  return { completed: progress.completed };
}

/**
 * Check whether a user qualifies for achievement `key`.
 * Creates UserAchievement (unlocked) if not already present and condition is met.
 * Returns true if newly unlocked.
 */
export async function checkAchievement(
  userId: Types.ObjectId,
  key: string,
  now: Date = new Date()
): Promise<boolean> {
  await connectToDatabase();
  const Achievement = (await import('@/models/Achievement')).default;
  const UserAchievement = (await import('@/models/UserAchievement')).default;
  const User = (await import('@/models/User')).default;

  const achievement = await Achievement.findOne({ key });
  if (!achievement) return false;

  const existing = await UserAchievement.findOne({
    user: userId,
    achievement: achievement._id,
  });
  if (existing?.unlockedAt) return false;

  const user = await User.findById(userId).select(
    'streakDays level xp'
  );
  if (!user) return false;

  // Condition gate per achievement key
  let qualifies = false;
  switch (key) {
    case 'first-exercise': {
      const Solution = (await import('@/models/Solution')).default;
      const count = await Solution.countDocuments({ authorId: userId });
      qualifies = count >= 1;
      break;
    }
    case 'streak-7':
      qualifies = (user.streakDays ?? 0) >= 7;
      break;
    case 'streak-30':
      qualifies = (user.streakDays ?? 0) >= 30;
      break;
    case 'level-5':
      qualifies = (user.level ?? 1) >= 5;
      break;
    case 'comments-50': {
      const Comment = (await import('@/models/Comment')).default;
      const count = await Comment.countDocuments({ authorId: userId });
      qualifies = count >= 50;
      break;
    }
    case 'top-100':
      qualifies = (user.nationalRank ?? 0) > 0 && (user.nationalRank ?? 9999) <= 100;
      break;
    default:
      break;
  }

  if (!qualifies) return false;

  // Upsert the UserAchievement record
  await UserAchievement.findOneAndUpdate(
    { user: userId, achievement: achievement._id },
    { $set: { unlockedAt: now, progress: 100 } },
    { upsert: true }
  );

  // Grant XP reward
  if (achievement.xpReward > 0) {
    await grantXp(userId, achievement.xpReward, 'achievement-unlocked', {
      achievementKey: key,
    });
  }

  return true;
}
