import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface ISession extends Document {
  title: string;
  description: string;
  teacherId: Types.ObjectId;
  subject: string;
  exerciseIds: Types.ObjectId[];
  topics: string[];
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string;
  capacity: number | null;
  priceDA: number;
  status: SessionStatus;
  enrolledCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    exerciseIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
      default: [],
    },
    topics: { type: [String], default: [] },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 480,
    },
    meetingUrl: { type: String, required: true },
    capacity: { type: Number, default: null, min: 1 },
    priceDA: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'cancelled'] as const,
      default: 'scheduled',
    },
    enrolledCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Compound index for upcoming-session queries
SessionSchema.index({ scheduledAt: 1, status: 1 });

const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) ??
  mongoose.model<ISession>('Session', SessionSchema);

export default Session;
