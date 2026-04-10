export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  points: number;
  isVerifiedTeacher: boolean;
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
