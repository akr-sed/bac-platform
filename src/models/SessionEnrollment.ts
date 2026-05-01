import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISessionEnrollment extends Document {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  createdAt: Date;
}

/**
 * SessionEnrollment counter contract
 * ----------------------------------
 * `Session.enrolledCount` is a denormalized counter maintained at TWO layers:
 *
 *   1. INCREMENT happens at the API-route layer via a single atomic
 *      `Session.findOneAndUpdate({ ..., $or: [{ capacity: null }, { $expr: {
 *      $lt: ['$enrolledCount', '$capacity'] } }] }, { $inc: { enrolledCount:
 *      1 } })` BEFORE the `SessionEnrollment` document is created. This is
 *      the only correct way to enforce capacity under concurrency. We do
 *      NOT use a `post('save')` hook, because the route's atomic claim is
 *      what gates the increment on capacity — a hook would either
 *      double-count (if both fired) or be unable to enforce the gate (if
 *      it ran instead of the route's update).
 *
 *   2. DECREMENT happens via the `post('findOneAndDelete')` hook below
 *      (used by the unenroll route). It also happens via a `pre('save')`
 *      hook on the `Session` model when a session transitions to
 *      `cancelled`, which `deleteMany`s all related enrollments and resets
 *      the counter to 0.
 *
 * Therefore: callers MUST mutate enrollments only via:
 *   - The enroll API route (POST /api/sessions/[id]/enroll), which performs
 *     the atomic capacity claim and then creates the enrollment.
 *   - `SessionEnrollment.findOneAndDelete(...)` for unenrollment.
 *   - The Session cancellation flow (PATCH status→cancelled or DELETE),
 *     which cascades and resets the counter.
 *
 * Direct calls like `SessionEnrollment.create(...)`, `deleteOne`,
 * `deleteMany`, `bulkWrite`, or raw `db.sessionenrollments....` operations
 * will skew `enrolledCount` and must NOT be used outside of dedicated
 * test/cleanup scripts that compensate the counter manually.
 */
const SessionEnrollmentSchema = new Schema<ISessionEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SessionEnrollmentSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
SessionEnrollmentSchema.index({ sessionId: 1 });

import Session from './Session';

SessionEnrollmentSchema.post(
  'findOneAndDelete',
  async function (doc: ISessionEnrollment | null) {
    if (!doc) return;
    await Session.updateOne(
      { _id: doc.sessionId },
      { $inc: { enrolledCount: -1 } }
    );
  }
);

const SessionEnrollment: Model<ISessionEnrollment> =
  (mongoose.models.SessionEnrollment as Model<ISessionEnrollment>) ??
  mongoose.model<ISessionEnrollment>(
    'SessionEnrollment',
    SessionEnrollmentSchema
  );

export default SessionEnrollment;
