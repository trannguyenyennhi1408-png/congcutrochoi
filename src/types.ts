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

export interface AppSettings {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  autoSave: boolean;
  geminiApiKey: string;
  aiModel: string;
}

export interface AppData {
  subjects: Subject[];
  questions: Question[];
  sessions: Session[];
  progress: Progress;
  settings: AppSettings;
}
