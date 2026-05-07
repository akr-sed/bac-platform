import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  solutionId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    solutionId: { type: Schema.Types.ObjectId, ref: 'Solution', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

import Solution from './Solution';
import Exercise from './Exercise';

CommentSchema.post('save', async function (doc) {
  const sol = await Solution.findById(doc.solutionId).select('exerciseId');
  if (!sol) return;
  await Exercise.updateOne(
    { _id: sol.exerciseId },
    { $inc: { commentsCount: 1 }, $set: { lastActivityAt: new Date() } }
  );
});

CommentSchema.post('findOneAndDelete', async function (doc: any) {
  if (!doc) return;
  const sol = await Solution.findById(doc.solutionId).select('exerciseId');
  if (!sol) return;
  await Exercise.updateOne(
    { _id: sol.exerciseId },
    { $inc: { commentsCount: -1 }, $set: { lastActivityAt: new Date() } }
  );
});

const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment>) ??
  mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
