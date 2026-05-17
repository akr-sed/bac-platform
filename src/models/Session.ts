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
// Text index for full-text search (§6.10). Forces re-indexing on next mongo
// connection — non-destructive but adds background index build time on first start.
SessionSchema.index({ title: 'text', description: 'text', subject: 'text' });

// ---------------------------------------------------------------------------
// Cancellation cascade
// ---------------------------------------------------------------------------
// When a Session transitions to `cancelled` (via PATCH update or via the
// soft-delete DELETE route which sets status='cancelled' + .save()), we must
// reset the enrolledCount counter and remove all related `SessionEnrollment`
// records. Otherwise the counter is wrong (unenrolling from a cancelled
// session would push it below 0) and orphaned enrollments stay around.
//
// The cascade is wired in two places:
//   1. `pre('save')` — fires for `sessionDoc.status = 'cancelled';
//      sessionDoc.save()` (the DELETE route).
//   2. `pre('findOneAndUpdate')` — fires for `Session.findByIdAndUpdate(id,
//      { status: 'cancelled' })` (the PATCH route).
//
// We import `SessionEnrollment` lazily via `mongoose.models` to avoid the
// circular import (`SessionEnrollment` already imports `Session`). The model
// is registered by the time any hook fires because the API routes import
// both modules before serving a request.

import type { Model as MongooseModel } from 'mongoose';
import type { ISessionEnrollment } from './SessionEnrollment';

function getSessionEnrollmentModel(): MongooseModel<ISessionEnrollment> | null {
  return (
    (mongoose.models.SessionEnrollment as
      | MongooseModel<ISessionEnrollment>
      | undefined) ?? null
  );
}

SessionSchema.pre('save', async function () {
  // `this.isModified('status')` is true when status has been mutated on this
  // document instance since it was loaded; on a brand-new doc all paths are
  // "modified", so also gate on the doc not being new.
  if (
    !this.isNew &&
    this.isModified('status') &&
    this.status === 'cancelled'
  ) {
    const SessionEnrollment = getSessionEnrollmentModel();
    if (SessionEnrollment) {
      await SessionEnrollment.deleteMany({ sessionId: this._id });
    }
    // Mark the path as modified explicitly so `.save()` actually writes the
    // reset value to the database — without this, an unchanged in-memory
    // value of `enrolledCount` (e.g. 0 because it was loaded stale) would
    // not be persisted, leaving the DB counter desynced from reality.
    this.enrolledCount = 0;
    this.markModified('enrolledCount');
  }
});

SessionSchema.pre('findOneAndUpdate', async function () {
  // The update may be a plain object `{ status: 'cancelled', ... }` or use
  // operators (`{ $set: { status: 'cancelled' } }`). Inspect both shapes.
  const update = this.getUpdate() as
    | (Partial<ISession> & { $set?: Partial<ISession> })
    | null;
  if (!update) return;
  const nextStatus = update.$set?.status ?? update.status;
  if (nextStatus === 'cancelled') {
    const filter = this.getFilter();
    const target = await this.model.findOne(filter).select('_id status');
    // Only cascade on a real transition INTO cancelled. If the doc is already
    // cancelled, treat as a no-op so we don't redundantly delete twice.
    if (target && target.status !== 'cancelled') {
      const SessionEnrollment = getSessionEnrollmentModel();
      if (SessionEnrollment) {
        await SessionEnrollment.deleteMany({ sessionId: target._id });
      }
      // Force enrolledCount back to 0 in the same update so it lands
      // atomically with the status flip.
      if (update.$set) {
        update.$set.enrolledCount = 0;
      } else {
        update.enrolledCount = 0;
      }
      this.setUpdate(update);
    }
  }
});

const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) ??
  mongoose.model<ISession>('Session', SessionSchema);

export default Session;
