export type QuestionType = 'multiple-choice' | 'matching' | 'essay';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Subject {
  id: string;
  name: string;
  icon: string;
  questionsCount: number;
}

export interface Question {
  id: string;
  subjectId: string;
  content: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: Difficulty;
}

export interface Session {
  id: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  date: string;
}

export interface Progress {
  totalAttempts: number;
  averageScore: number;
  streakDays: number;
  weakTopics: string[];
}

export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  classCode?: string; // Students belong to a class
}

export interface StudentRecord {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  students: StudentRecord[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  autoSave: boolean;
  geminiApiKey: string;
  aiModel: string;
}

export interface AppData {
  currentUser: User | null;
  users: User[]; // Store registered accounts for persistence
  classrooms: Classroom[];
  subjects: Subject[];
  questions: Question[];
  sessions: Session[];
  progress: Progress;
  settings: AppSettings;
}
