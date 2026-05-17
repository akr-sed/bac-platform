import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISavedExercise extends Document {
  userId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  createdAt: Date;
}

const SavedExerciseSchema = new Schema<ISavedExercise>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SavedExerciseSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });
SavedExerciseSchema.index({ userId: 1, createdAt: -1 });

const SavedExercise: Model<ISavedExercise> =
  (mongoose.models.SavedExercise as Model<ISavedExercise>) ??
  mongoose.model<ISavedExercise>('SavedExercise', SavedExerciseSchema);

export default SavedExercise;
