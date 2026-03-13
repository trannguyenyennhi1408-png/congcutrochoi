import { AppData, Subject, Question } from './types';

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Toán học', icon: 'Calculator', questionsCount: 10 },
  { id: 'science', name: 'Khoa học', icon: 'FlaskConical', questionsCount: 8 },
  { id: 'history', name: 'Lịch sử', icon: 'History', questionsCount: 5 },
  { id: 'english', name: 'Tiếng Anh', icon: 'Languages', questionsCount: 12 },
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subjectId: 'math',
    content: 'Kết quả của phép tính 15 x 4 là bao nhiêu?',
    type: 'multiple-choice',
    options: ['45', '50', '60', '70'],
    correctAnswer: '60',
    explanation: '15 x 4 = 60',
    difficulty: 'easy',
  },
  {
    id: 'q2',
    subjectId: 'math',
    content: 'Số nào là số nguyên tố?',
    type: 'multiple-choice',
    options: ['4', '9', '15', '17'],
    correctAnswer: '17',
    explanation: 'Số nguyên tố là số chỉ chia hết cho 1 và chính nó. 17 là số nguyên tố.',
    difficulty: 'medium',
  },
  {
    id: 'q3',
    subjectId: 'science',
    content: 'Nước sôi ở bao nhiêu độ C?',
    type: 'multiple-choice',
    options: ['90', '100', '110', '120'],
    correctAnswer: '100',
    explanation: 'Ở áp suất tiêu chuẩn, nước sôi ở 100 độ C.',
    difficulty: 'easy',
  },
  {
    id: 'q4',
    subjectId: 'history',
    content: 'Chiến thắng Điện Biên Phủ diễn ra vào năm nào?',
    type: 'multiple-choice',
    options: ['1945', '1954', '1968', '1975'],
    correctAnswer: '1954',
    explanation: 'Chiến thắng Điện Biên Phủ lừng lẫy năm châu, chấn động địa cầu diễn ra vào năm 1954.',
    difficulty: 'medium',
  },
];

export const INITIAL_APP_DATA: AppData = {
  subjects: INITIAL_SUBJECTS,
  questions: INITIAL_QUESTIONS,
  sessions: [],
  progress: {
    totalAttempts: 0,
    averageScore: 0,
    streakDays: 0,
    weakTopics: [],
  },
  settings: {
    theme: 'light',
    soundEnabled: true,
    autoSave: true,
    geminiApiKey: '',
    aiModel: 'gemini-3-flash-preview',
  },
};

export const AI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Nhanh)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Thông minh)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ổn định)' },
];
