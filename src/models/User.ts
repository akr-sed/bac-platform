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
  // Gamification fields (Wave 6)
  xp?: number;
  level?: number;
  streakDays?: number;
  streakLastDay?: Date;
  nationalRank?: number;
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
    // Gamification (Wave 6)
    xp: { type: Number, default: 0, min: 0, index: true },
    level: { type: Number, default: 1, min: 1 },
    streakDays: { type: Number, default: 0, min: 0 },
    streakLastDay: { type: Date, default: undefined },
    nationalRank: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Cascade: when a user is deleted, drop their owned Sessions + any
// SessionEnrollment they participated in. Models are resolved lazily through
// `mongoose.models` to avoid the User → Session → User circular import.
// ---------------------------------------------------------------------------

interface CascadeModels {
  Session: Model<{ teacherId: mongoose.Types.ObjectId }> | null;
  SessionEnrollment: Model<{
    sessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
  }> | null;
}

function getCascadeModels(): CascadeModels {
  return {
    Session:
      (mongoose.models.Session as CascadeModels['Session']) ?? null,
    SessionEnrollment:
      (mongoose.models.SessionEnrollment as CascadeModels['SessionEnrollment']) ??
      null,
  };
}

async function cascadeForUserIds(userIds: mongoose.Types.ObjectId[]) {
  if (userIds.length === 0) return;
  const { Session, SessionEnrollment } = getCascadeModels();
  if (SessionEnrollment) {
    // Enrollments where the user is the student OR the user is the teacher
    // (i.e. via their session). Resolve owned session ids first.
    const ownedSessionIds = Session
      ? (await Session.find({ teacherId: { $in: userIds } }).select('_id').lean())
          .map((s) => s._id)
      : [];
    await SessionEnrollment.deleteMany({
      $or: [
        { userId: { $in: userIds } },
        ...(ownedSessionIds.length > 0
          ? [{ sessionId: { $in: ownedSessionIds } }]
          : []),
      ],
    });
  }
  if (Session) {
    await Session.deleteMany({ teacherId: { $in: userIds } });
  }
}

// Document-level: `userDoc.deleteOne()`
UserSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await cascadeForUserIds([this._id as mongoose.Types.ObjectId]);
});

// Query-level: `User.deleteOne(filter)` / `User.deleteMany(filter)` /
// `User.findOneAndDelete(filter)`. We resolve the impacted ids ahead of the
// delete so the cascade query can use them after the parent rows are gone.
async function resolveAndCascade(this: mongoose.Query<unknown, IUser>) {
  const filter = this.getFilter();
  const Model = this.model;
  const docs = await Model.find(filter).select('_id').lean<{ _id: mongoose.Types.ObjectId }[]>();
  await cascadeForUserIds(docs.map((d) => d._id));
}

UserSchema.pre('deleteOne', { document: false, query: true }, resolveAndCascade);
UserSchema.pre('deleteMany', { document: false, query: true }, resolveAndCascade);
UserSchema.pre('findOneAndDelete', resolveAndCascade);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ??
  mongoose.model<IUser>('User', UserSchema);

export default User;
