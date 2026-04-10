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
  },
  { timestamps: true }
);

const Exercise: Model<IExercise> =
  (mongoose.models.Exercise as Model<IExercise>) ??
  mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
