import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { FILIERE_KEYS, type FiliereKey } from '@/lib/filiere';

export { FILIERE_KEYS };
export type { FiliereKey };

export type FigureContext = 'question' | 'solution';
export type FigureType =
  | 'graph' | 'geometric' | 'table' | 'probability_tree'
  | 'number_line' | 'statistical_chart' | 'circuit' | 'diagram' | 'other';

export interface IFigureSubdoc {
  figureId: string;
  cloudinaryUrl: string;
  context: FigureContext;
  figureType?: FigureType;
  description: string;
  exerciseRef?: number;
  partRef?: string | null;
  sourcePage?: number;
  boundingBox?: [number, number, number, number];
}

export interface IPartSubdoc {
  partId: string;
  label: string;
  subLabel?: string | null;
  statement: string;
  solution?: string | null;
  dependsOn: string[];
  marks?: number | null;
  hasFigure: boolean;
  ordering: number;
}

export interface IExercise extends Document {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  subtopic: string;
  authorId: Types.ObjectId;
  attachments: string[];
  likesCount: number;
  solutionCount: number;
  commentsCount: number;
  lastActivityAt: Date;
  // Exam-import metadata (all optional, backwards compatible with previously seeded docs).
  examId?: Types.ObjectId;
  examNumber?: number;
  concepts?: string[];
  marks?: number;
  sourcePage?: number;
  figureDescriptions?: string[];
  hasMath?: boolean;
  // BAC stream (denormalized from Exam.filiere for fast library filtering).
  filiere?: FiliereKey;
  // Admin "Featured" flag.
  featured?: boolean;
  // ── New structured fields (populated by the bac-results-new reimporter) ──
  statement?: string;
  parts?: IPartSubdoc[];
  figures?: IFigureSubdoc[];
  sujet?: number | null;
  language?: 'ar' | 'fr' | 'ar_fr' | null;
  createdAt: Date;
  updatedAt: Date;
}

const FigureSubdocSchema = new Schema<IFigureSubdoc>(
  {
    figureId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    context: {
      type: String,
      enum: ['question', 'solution'] as const,
      required: true,
    },
    figureType: {
      type: String,
      enum: [
        'graph', 'geometric', 'table', 'probability_tree',
        'number_line', 'statistical_chart', 'circuit', 'diagram', 'other',
      ] as const,
    },
    description: { type: String, default: '' },
    exerciseRef: { type: Number },
    partRef: { type: String, default: null },
    sourcePage: { type: Number },
    boundingBox: { type: [Number], default: undefined },
  },
  { _id: false }
);

const PartSubdocSchema = new Schema<IPartSubdoc>(
  {
    partId: { type: String, required: true },
    label: { type: String, required: true },
    subLabel: { type: String, default: null },
    statement: { type: String, required: true },
    solution: { type: String, default: null },
    dependsOn: { type: [String], default: [] },
    marks: { type: Number, default: null },
    hasFigure: { type: Boolean, default: false },
    ordering: { type: Number, default: 0 },
  },
  { _id: false }
);

const ExerciseSchema = new Schema<IExercise>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'] as const,
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    subtopic: { type: String, default: '', trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{ type: String }],
    likesCount: { type: Number, default: 0, min: 0, index: true },
    solutionCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    lastActivityAt: { type: Date, default: () => new Date(), index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', index: true },
    examNumber: { type: Number },
    concepts: { type: [String], default: undefined },
    marks: { type: Number },
    sourcePage: { type: Number },
    figureDescriptions: { type: [String], default: undefined },
    hasMath: { type: Boolean, default: false },
    filiere: {
      type: String,
      enum: FILIERE_KEYS as unknown as string[],
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    // ── New structured fields ──
    statement: { type: String },
    parts: { type: [PartSubdocSchema], default: undefined },
    figures: { type: [FigureSubdocSchema], default: undefined },
    sujet: { type: Number, default: null },
    language: {
      type: String,
      enum: ['ar', 'fr', 'ar_fr'] as const,
      default: null,
    },
  },
  { timestamps: true }
);

ExerciseSchema.index({ subject: 1, lastActivityAt: -1 });
// `language_override` set to an unused field name. Without this, MongoDB
// would treat our top-level `language` field ("ar"/"fr"/"ar_fr") as a
// text-index language override and reject inserts because "ar" isn't a
// supported stemmer language.
ExerciseSchema.index(
  { title: 'text', description: 'text', topic: 'text' },
  { language_override: '_textLang' }
);

const Exercise: Model<IExercise> =
  (mongoose.models.Exercise as Model<IExercise>) ??
  mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
