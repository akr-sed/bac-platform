import mongoose, { Schema, model, models } from 'mongoose';

// TODO(wave5): wire trigger on like/comment — Notification.create() calls will
// be injected into existing like/comment/solution API routes in Wave 5.

export type NotificationType = 'like' | 'comment' | 'mention' | 'reply' | 'follow';
export type NotificationTargetType = 'exercise' | 'solution' | 'comment' | 'session';

export interface INotification {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetId: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:       { type: String, enum: ['like', 'comment', 'mention', 'reply', 'follow'], required: true },
    targetType: { type: String, enum: ['exercise', 'solution', 'comment', 'session'], required: true },
    targetId:   { type: Schema.Types.ObjectId, required: true },
    read:       { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound indexes for efficient notification list queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

export default models.Notification || model<INotification>('Notification', NotificationSchema);
