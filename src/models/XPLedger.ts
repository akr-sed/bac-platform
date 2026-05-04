import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IXPLedger extends Document {
  user: Types.ObjectId;
  delta: number;
  reason: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const XPLedgerSchema = new Schema<IXPLedger>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    delta: { type: Number, required: true },
    reason: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

// Descending index on createdAt for recent activity queries
XPLedgerSchema.index({ user: 1, createdAt: -1 });

const XPLedger: Model<IXPLedger> =
  (mongoose.models.XPLedger as Model<IXPLedger>) ??
  mongoose.model<IXPLedger>('XPLedger', XPLedgerSchema);

export default XPLedger;
