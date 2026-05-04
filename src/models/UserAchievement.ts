import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IUserAchievement extends Document {
  user: Types.ObjectId;
  achievement: Types.ObjectId;
  unlockedAt?: Date;
  progress: number; // 0-100; 100 means unlocked
  createdAt: Date;
  updatedAt: Date;
}

const UserAchievementSchema = new Schema<IUserAchievement>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    achievement: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
    unlockedAt: { type: Date, default: undefined },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Compound unique: one row per user × achievement
UserAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

const UserAchievement: Model<IUserAchievement> =
  (mongoose.models.UserAchievement as Model<IUserAchievement>) ??
  mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);

export default UserAchievement;
