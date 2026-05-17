import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReport extends Document {
  reportedBy: Types.ObjectId;
  targetType: 'exercise' | 'solution' | 'comment' | 'user';
  targetId: Types.ObjectId;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['exercise', 'solution', 'comment', 'user'] as const,
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'] as const,
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Report: Model<IReport> =
  (mongoose.models.Report as Model<IReport>) ??
  mongoose.model<IReport>('Report', ReportSchema);

export default Report;
