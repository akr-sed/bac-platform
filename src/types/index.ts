export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  points: number;
  isVerifiedTeacher: boolean;
  avatar?: string | null;
  preferences?: { subjects: string[] };
  createdAt: string;
}

export interface ExerciseDTO {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  subtopic: string;
  author: UserDTO;
  attachments: string[];
  solutionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SolutionDTO {
  _id: string;
  exerciseId: string;
  author: UserDTO;
  content: string;
  images: string[];
  likes: string[];
  likesCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  _id: string;
  solutionId: string;
  author: UserDTO;
  content: string;
  createdAt: string;
}

export interface ReportDTO {
  _id: string;
  reportedBy: UserDTO;
  targetType: 'exercise' | 'solution' | 'comment' | 'user';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CategoryDTO {
  _id: string;
  name: { en: string; fr: string; ar: string };
  type: 'subject' | 'topic' | 'subtopic';
  parentId: string | null;
  order: number;
  children?: CategoryDTO[];
}

export interface HintDTO {
  hint: string;
  disclaimer: string;
  exerciseId: string;
}

export interface DashboardDTO {
  user: UserDTO;
  stats: {
    exercisesPosted: number;
    solutionsSubmitted: number;
    commentsCount: number;
    likesReceived: number;
  };
  recentActivity: ActivityItem[];
  pointsBreakdown: {
    fromSolutions: number;
    fromComments: number;
    fromLikes: number;
  };
}

export interface ActivityItem {
  type: 'solution' | 'comment' | 'exercise';
  title: string;
  targetId: string;
  createdAt: string;
}

export interface FeedItemDTO {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  attachments: string[];
  likesCount: number;
  solutionCount: number;
  commentsCount: number;
  lastActivityAt: string;
  author: Pick<UserDTO, '_id' | 'name' | 'avatar' | 'role' | 'isVerifiedTeacher'>;
  isLiked?: boolean;
  isSaved?: boolean;
}

export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export type SessionTeacherDTO = Pick<
  UserDTO,
  '_id' | 'name' | 'avatar' | 'role' | 'isVerifiedTeacher'
>;

export interface SessionDTO {
  _id: string;
  title: string;
  description: string;
  teacher: SessionTeacherDTO;
  subject: string;
  topics: string[];
  exerciseIds: string[];
  scheduledAt: string;
  durationMinutes: number;
  /**
   * Only present when the requester is the session's teacher or an enrolled
   * student. Hidden from anonymous / non-enrolled students.
   */
  meetingUrl?: string;
  capacity: number | null;
  priceDA: number;
  status: SessionStatus;
  enrolledCount: number;
  isEnrolled?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionEnrollmentDTO {
  _id: string;
  userId: string;
  sessionId: string;
  createdAt: string;
}
