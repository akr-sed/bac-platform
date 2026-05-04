import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher' | 'admin';
  points: number;
  isVerifiedTeacher: boolean;
  avatar?: string;
  bio?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  verificationToken?: string;
  emailVerifiedAt?: Date;
  preferences?: {
    subjects: string[];
    stream?: string;
    year?: string;
    interests?: string[];
  };
  onboardedAt?: Date;
  notificationPrefs?: {
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    weeklyDigest: boolean;
    marketing: boolean;
  };
  privacyPrefs?: {
    profilePublic: boolean;
    searchIndexing: boolean;
  };
  isBlocked?: boolean;
  blockedAt?: Date;
  blockedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'] as const,
      default: 'student',
    },
    points: { type: Number, default: 0, min: 0 },
    isVerifiedTeacher: { type: Boolean, default: false },
    avatar: { type: String, default: undefined },
    resetToken: { type: String, default: undefined },
    resetTokenExpiry: { type: Date, default: undefined },
    verificationToken: { type: String, default: undefined },
    emailVerifiedAt: { type: Date, default: undefined },
    bio: { type: String, default: undefined },
    preferences: {
      subjects: { type: [String], default: [] },
      stream: { type: String, default: undefined },
      year: { type: String, default: undefined },
      interests: { type: [String], default: [] },
    },
    onboardedAt: { type: Date, default: undefined },
    notificationPrefs: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    privacyPrefs: {
      profilePublic: { type: Boolean, default: true },
      searchIndexing: { type: Boolean, default: true },
    },
    isBlocked: { type: Boolean, default: false, index: true },
    blockedAt: { type: Date, default: undefined },
    blockedReason: { type: String, default: undefined },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ??
  mongoose.model<IUser>('User', UserSchema);

export default User;
