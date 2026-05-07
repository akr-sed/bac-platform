import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IExam extends Document {
  title: string;
  year: number;
  subject: string;
  level: string;
  source: {
    filename: string;
    parsedExamId: string;
  };
  exerciseIds: Types.ObjectId[];
  importedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: true, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    level: { type: String, default: '3AS', trim: true },
    source: {
      filename: { type: String, default: '', trim: true },
      parsedExamId: { type: String, trim: true },
    },
    exerciseIds: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
    importedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

ExamSchema.index({ subject: 1, year: -1 });

// Idempotency: a given parsed exam ID can map to at most one Exam document.
// Partial filter avoids clashing with documents that lack the field
// (legacy seeds and any non-import-flow inserts).
ExamSchema.index(
  { 'source.parsedExamId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'source.parsedExamId': { $type: 'string' },
    },
  }
);

const Exam: Model<IExam> =
  (mongoose.models.Exam as Model<IExam>) ??
  mongoose.model<IExam>('Exam', ExamSchema);

export default Exam;
