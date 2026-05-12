import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ICollection extends Document {
  ownerId: Types.ObjectId;
  title: string;
  description?: string;
  exerciseIds: Types.ObjectId[];
  visibility: 'public' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 1 },
    description: { type: String, default: undefined, trim: true },
    exerciseIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'private'] as const,
      default: 'public',
    },
  },
  { timestamps: true }
);

// Primary access pattern: "list a user's collections, newest activity first".
// Matches both owner-only listings and the public viewer when filtered by owner.
CollectionSchema.index({ ownerId: 1, updatedAt: -1 });

const Collection: Model<ICollection> =
  (mongoose.models.Collection as Model<ICollection>) ??
  mongoose.model<ICollection>('Collection', CollectionSchema);

export default Collection;
