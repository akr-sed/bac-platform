import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IExerciseLike extends Document {
  userId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  createdAt: Date;
}

const ExerciseLikeSchema = new Schema<IExerciseLike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ExerciseLikeSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });
ExerciseLikeSchema.index({ exerciseId: 1 });

import Exercise from './Exercise';

ExerciseLikeSchema.post('save', async function (doc) {
  await Exercise.updateOne(
    { _id: doc.exerciseId },
    { $inc: { likesCount: 1 }, $set: { lastActivityAt: new Date() } }
  );
});

ExerciseLikeSchema.post('findOneAndDelete', async function (doc: any) {
  if (!doc) return;
  await Exercise.updateOne(
    { _id: doc.exerciseId },
    { $inc: { likesCount: -1 } }
  );
});

const ExerciseLike: Model<IExerciseLike> =
  (mongoose.models.ExerciseLike as Model<IExerciseLike>) ??
  mongoose.model<IExerciseLike>('ExerciseLike', ExerciseLikeSchema);

export default ExerciseLike;
