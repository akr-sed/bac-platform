import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IExercise extends Document {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  subtopic: string;
  authorId: Types.ObjectId;
  attachments: string[];
  likesCount: number;
  solutionCount: number;
  commentsCount: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'] as const,
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    subtopic: { type: String, default: '', trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{ type: String }],
    likesCount: { type: Number, default: 0, min: 0, index: true },
    solutionCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    lastActivityAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

ExerciseSchema.index({ subject: 1, lastActivityAt: -1 });

const Exercise: Model<IExercise> =
  (mongoose.models.Exercise as Model<IExercise>) ??
  mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
