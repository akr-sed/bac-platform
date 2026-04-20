import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISolution extends Document {
  exerciseId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  images: string[];
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SolutionSchema = new Schema<ISolution>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

import Exercise from './Exercise';
import Comment from './Comment';

SolutionSchema.post('save', async function (doc) {
  await Exercise.updateOne(
    { _id: doc.exerciseId },
    { $inc: { solutionCount: 1 }, $set: { lastActivityAt: new Date() } }
  );
});

SolutionSchema.post('findOneAndDelete', async function (doc: any) {
  if (!doc) return;
  const commentsDeleted = await Comment.countDocuments({ solutionId: doc._id });
  await Exercise.updateOne(
    { _id: doc.exerciseId },
    {
      $inc: { solutionCount: -1, commentsCount: -commentsDeleted },
      $set: { lastActivityAt: new Date() },
    }
  );
});

const Solution: Model<ISolution> =
  (mongoose.models.Solution as Model<ISolution>) ??
  mongoose.model<ISolution>('Solution', SolutionSchema);

export default Solution;
