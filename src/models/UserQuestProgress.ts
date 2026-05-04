import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IUserQuestProgress extends Document {
  user: Types.ObjectId;
  quest: Types.ObjectId;
  date: string; // YYYY-MM-DD
  current: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserQuestProgressSchema = new Schema<IUserQuestProgress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quest: { type: Schema.Types.ObjectId, ref: 'DailyQuest', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    current: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound unique: one row per user × quest × day
UserQuestProgressSchema.index({ user: 1, quest: 1, date: 1 }, { unique: true });
// Fast lookup of today's quests for a user
UserQuestProgressSchema.index({ user: 1, date: 1 });

const UserQuestProgress: Model<IUserQuestProgress> =
  (mongoose.models.UserQuestProgress as Model<IUserQuestProgress>) ??
  mongoose.model<IUserQuestProgress>('UserQuestProgress', UserQuestProgressSchema);

export default UserQuestProgress;
