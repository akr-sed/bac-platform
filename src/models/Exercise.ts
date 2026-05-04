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
  // Exam-import metadata (all optional, backwards compatible with previously seeded docs).
  examId?: Types.ObjectId;
  examNumber?: number;
  concepts?: string[];
  marks?: number;
  sourcePage?: number;
  figureDescriptions?: string[];
  hasMath?: boolean;
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
    // Optional exam-import fields. Existing exercises (created before this feature)
    // simply lack these properties — Mongoose will not require them.
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', index: true },
    examNumber: { type: Number },
    concepts: { type: [String], default: undefined },
    marks: { type: Number },
    sourcePage: { type: Number },
    figureDescriptions: { type: [String], default: undefined },
    hasMath: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExerciseSchema.index({ subject: 1, lastActivityAt: -1 });
// Text index for full-text search (§6.10). Forces re-indexing on next mongo
// connection — non-destructive but adds background index build time on first start.
ExerciseSchema.index({ title: 'text', description: 'text', topic: 'text' });

const Exercise: Model<IExercise> =
  (mongoose.models.Exercise as Model<IExercise>) ??
  mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
