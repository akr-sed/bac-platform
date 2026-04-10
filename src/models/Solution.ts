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

const Solution: Model<ISolution> =
  (mongoose.models.Solution as Model<ISolution>) ??
  mongoose.model<ISolution>('Solution', SolutionSchema);

export default Solution;
