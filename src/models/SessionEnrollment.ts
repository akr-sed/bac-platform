import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISessionEnrollment extends Document {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  createdAt: Date;
}

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

SessionEnrollmentSchema.post('save', async function (doc) {
  await Session.updateOne(
    { _id: doc.sessionId },
    { $inc: { enrolledCount: 1 } }
  );
});

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
