import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/**
 * Follow — directed many-to-many between users. A document means
 * `follower` is following `followee`. Wave C1.
 *
 * Indexes:
 *  - `{ follower, followee }` compound unique → enforces idempotent follows
 *    and powers "is the viewer following X?" lookups.
 *  - `{ followee }` → list a user's followers / count.
 *  - `{ follower }` → list a user's followings / count and feed scoping.
 */
export interface IFollow extends Document {
  follower: Types.ObjectId;
  followee: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

FollowSchema.index({ follower: 1, followee: 1 }, { unique: true });
FollowSchema.index({ followee: 1 });
FollowSchema.index({ follower: 1 });

const Follow: Model<IFollow> =
  (mongoose.models.Follow as Model<IFollow>) ??
  mongoose.model<IFollow>('Follow', FollowSchema);

export default Follow;
