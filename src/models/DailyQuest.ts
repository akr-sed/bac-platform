import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDailyQuest extends Document {
  key: string;
  titleKey: string;
  goal: number;
  rewardXp: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DailyQuestSchema = new Schema<IDailyQuest>(
  {
    key: { type: String, unique: true, required: true },
    titleKey: { type: String, required: true },
    goal: { type: Number, required: true, min: 1 },
    rewardXp: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const DailyQuest: Model<IDailyQuest> =
  (mongoose.models.DailyQuest as Model<IDailyQuest>) ??
  mongoose.model<IDailyQuest>('DailyQuest', DailyQuestSchema);

export default DailyQuest;
