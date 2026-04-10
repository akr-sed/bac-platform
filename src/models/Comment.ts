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

const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment>) ??
  mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
