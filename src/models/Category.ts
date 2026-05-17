import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  name: { en: string; fr: string; ar: string };
  type: 'subject' | 'topic' | 'subtopic';
  parentId: Types.ObjectId | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      fr: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    type: {
      type: String,
      enum: ['subject', 'topic', 'subtopic'] as const,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.index({ type: 1 });
CategorySchema.index({ parentId: 1 });

const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) ??
  mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
