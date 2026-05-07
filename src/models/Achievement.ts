import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAchievement extends Document {
  key: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    key: { type: String, unique: true, required: true },
    titleKey: { type: String, required: true },
    descriptionKey: { type: String, required: true },
    icon: { type: String, default: 'Award' },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'] as const,
      default: 'common',
    },
    xpReward: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Index on key is covered by unique; add rarity for catalog filtering
AchievementSchema.index({ rarity: 1 });

const Achievement: Model<IAchievement> =
  (mongoose.models.Achievement as Model<IAchievement>) ??
  mongoose.model<IAchievement>('Achievement', AchievementSchema);

export default Achievement;
