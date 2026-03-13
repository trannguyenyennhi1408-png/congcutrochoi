/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Gamepad2, 
  Settings, 
  Trophy, 
  MessageSquare, 
  Plus, 
  Search, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Menu,
  X,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Share2,
  Zap,
  BrainCircuit,
  Calculator,
  FlaskConical,
  History,
  Languages,
  GraduationCap,
  ArrowLeft,
  Play,
  Star,
  Timer,
  Award,
  Sparkles,
  Loader2,
  Send,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Subject, Question, Session, AppSettings, QuestionType, User, UserRole, Classroom } from './types';
import { INITIAL_APP_DATA, AI_MODELS } from './constants';
import { callGeminiAI, PROMPTS } from './services/geminiService';
import { exportQuestionsToWord } from './services/exportService';

// --- Components ---

const Header = ({ 
  title, 
  toggleSidebar, 
  openSettings,
  hasApiKey
}: { 
  title: string; 
  toggleSidebar: () => void; 
  openSettings: () => void;
  hasApiKey: boolean;
}) => (
  <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-bottom border-gray-100 shadow-sm">
    <div className="flex items-center gap-4">
      <button 
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        {title}
      </h1>
    </div>
    <div className="flex items-center gap-3">
      {!hasApiKey && (
        <span className="hidden sm:inline text-xs font-bold text-red-500 animate-pulse">
          Lấy API key để sử dụng app
        </span>
      )}
      <button 
        onClick={openSettings}
        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        title="Cài đặt"
      >
        <Settings size={20} />
      </button>
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
        <Zap size={14} />
        <span>Học tập AI</span>
      </div>
    </div>
  </header>
);

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-primary'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill" 
        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
      />
    )}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  // --- State ---
  const [appData, setAppData] = useState<AppData>(() => {
    const saved = localStorage.getItem('edugame_data');
    return saved ? JSON.parse(saved) : INITIAL_APP_DATA;
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'games' | 'leaderboard' | 'tutor' | 'manage' | 'classes'>('dashboard');
  const [selectedSubjectForManage, setSelectedSubjectForManage] = useState<Subject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  
  // Class Management State
  const [newClassName, setNewClassName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Quiz State
  const [gameMode, setGameMode] = useState<'quiz' | 'gold-miner' | 'memory' | 'speed' | null>(null);
  const [selectedGameForSubject, setSelectedGameForSubject] = useState<'quiz' | 'gold-miner' | 'memory' | 'speed' | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<{
    subject: Subject;
    questions: Question[];
    currentIndex: number;
    score: number;
    answers: (string | null)[];
    startTime: number;
    isFinished: boolean;
    // Memory specific
    memoryCards?: { id: number, text: string, type: 'q' | 'a', matchId: string, isFlipped: boolean, isMatched: boolean }[];
    memoryFlippedIndices?: number[];
    // Speed specific
    speedTimeLeft?: number;
  } | null>(null);
  
  // Manage State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // AI Tutor State
  const [tutorMessages, setTutorMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [tutorInput, setTutorInput] = useState('');
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('edugame_data', JSON.stringify(appData));
  }, [appData]);

  useEffect(() => {
    if (!appData.settings.geminiApiKey) {
      setShowSettings(true);
    }
  }, []);

  // --- Handlers ---
  const handleShare = (subject: Subject) => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomCode(code);
    setShowShareModal(true);
  };
  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppData(prev => ({ ...prev, settings: newSettings }));
    setShowSettings(false);
  };

  const startQuiz = (subject: Subject, mode: 'quiz' | 'gold-miner' | 'memory' | 'speed' = 'quiz') => {
    const subjectQuestions = appData.questions.filter(q => q.subjectId === subject.id);
    if (subjectQuestions.length === 0) {
      alert('Môn học này chưa có câu hỏi nào!');
      return;
    }
    
    let memoryCards = undefined;
    if (mode === 'memory') {
      const qNum = Math.min(subjectQuestions.length, 6);
      const selectedQs = [...subjectQuestions].sort(() => 0.5 - Math.random()).slice(0, qNum);
      const cards: any[] = [];
      selectedQs.forEach((q, idx) => {
        cards.push({ id: idx * 2, text: q.content, type: 'q', matchId: q.id, isFlipped: false, isMatched: false });
        cards.push({ id: idx * 2 + 1, text: q.correctAnswer, type: 'a', matchId: q.id, isFlipped: false, isMatched: false });
      });
      memoryCards = cards.sort(() => 0.5 - Math.random());
    }

    setGameMode(mode);
    setCurrentQuiz({
      subject,
      questions: subjectQuestions,
      currentIndex: 0,
      score: 0,
      answers: new Array(subjectQuestions.length).fill(null),
      startTime: Date.now(),
      isFinished: false,
      memoryCards,
      memoryFlippedIndices: [],
      speedTimeLeft: mode === 'speed' ? 10 : undefined // 10 seconds per question
    });
  };

  // Speed Mode Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameMode === 'speed' && currentQuiz && !currentQuiz.isFinished && currentQuiz.speedTimeLeft && currentQuiz.speedTimeLeft > 0) {
      timer = setTimeout(() => {
        setCurrentQuiz(prev => prev ? { ...prev, speedTimeLeft: prev.speedTimeLeft! - 1 } : null);
      }, 1000);
    } else if (gameMode === 'speed' && currentQuiz && !currentQuiz.isFinished && currentQuiz.speedTimeLeft === 0) {
      // Time's up for current question
      handleAnswer(''); // submit empty answer
    }
    return () => clearTimeout(timer);
  }, [gameMode, currentQuiz?.speedTimeLeft, currentQuiz?.isFinished]);

  const handleAnswer = (answer: string) => {
    if (!currentQuiz) return;
    
    const isCorrect = answer === currentQuiz.questions[currentQuiz.currentIndex].correctAnswer;
    const newAnswers = [...currentQuiz.answers];
    newAnswers[currentQuiz.currentIndex] = answer;
    
    const nextIndex = currentQuiz.currentIndex + 1;
    const isLast = nextIndex >= currentQuiz.questions.length;
    
    if (isLast) {
      const finalScore = currentQuiz.score + (isCorrect ? 1 : 0);
      const timeSpent = Math.floor((Date.now() - currentQuiz.startTime) / 1000);
      
      const newSession: Session = {
        id: Math.random().toString(36).substr(2, 9),
        subjectId: currentQuiz.subject.id,
        score: Math.round((finalScore / currentQuiz.questions.length) * 100),
        totalQuestions: currentQuiz.questions.length,
        correctAnswers: finalScore,
        timeSpent,
        date: new Date().toISOString()
      };
      
      setAppData(prev => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
        progress: {
          ...prev.progress,
          totalAttempts: prev.progress.totalAttempts + 1,
          averageScore: Math.round(((prev.progress.averageScore * prev.progress.totalAttempts) + newSession.score) / (prev.progress.totalAttempts + 1))
        }
      }));
      
      setCurrentQuiz(prev => prev ? {
        ...prev,
        score: finalScore,
        answers: newAnswers,
        isFinished: true
      } : null);
    } else {
      setCurrentQuiz(prev => prev ? {
        ...prev,
        score: prev.score + (isCorrect ? 1 : 0),
        currentIndex: nextIndex,
        answers: newAnswers,
        speedTimeLeft: gameMode === 'speed' ? 10 : undefined // reset timer
      } : null);
    }
  };

  const handleMemoryCardClick = (index: number) => {
    if (!currentQuiz || !currentQuiz.memoryCards || currentQuiz.isFinished) return;
    const cards = [...currentQuiz.memoryCards];
    let flipped = [...(currentQuiz.memoryFlippedIndices || [])];

    if (cards[index].isFlipped || cards[index].isMatched || flipped.length >= 2) return;

    cards[index].isFlipped = true;
    flipped.push(index);

    if (flipped.length === 2) {
      const [idx1, idx2] = flipped;
      if (cards[idx1].matchId === cards[idx2].matchId && cards[idx1].type !== cards[idx2].type) {
        // Match!
        cards[idx1].isMatched = true;
        cards[idx2].isMatched = true;
        
        const newScore = currentQuiz.score + 1;
        const allMatched = cards.every(c => c.isMatched);
        
        setCurrentQuiz(prev => prev ? {
            ...prev,
            score: newScore,
            memoryCards: cards,
            memoryFlippedIndices: []
        } : null);

        if (allMatched) {
            // End Memory Match Game
            setTimeout(() => {
                const timeSpent = Math.floor((Date.now() - currentQuiz.startTime) / 1000);
                const finalScorePercentage = 100; // all matched is 100%
                
                const newSession: Session = {
                    id: Math.random().toString(36).substr(2, 9),
                    subjectId: currentQuiz.subject.id,
                    score: finalScorePercentage,
                    totalQuestions: cards.length / 2,
                    correctAnswers: cards.length / 2,
                    timeSpent,
                    date: new Date().toISOString()
                };
                
                setAppData(prev => ({
                    ...prev,
                    sessions: [newSession, ...prev.sessions],
                    progress: {
                        ...prev.progress,
                        totalAttempts: prev.progress.totalAttempts + 1,
                        averageScore: Math.round(((prev.progress.averageScore * prev.progress.totalAttempts) + finalScorePercentage) / (prev.progress.totalAttempts + 1))
                    }
                }));
                
                setCurrentQuiz(prev => prev ? { ...prev, isFinished: true } : null);
            }, 500);
        }
      } else {
        // No match
        setTimeout(() => {
            setCurrentQuiz(prev => {
                if (!prev || !prev.memoryCards) return prev;
                const resetCards = [...prev.memoryCards];
                resetCards[idx1].isFlipped = false;
                resetCards[idx2].isFlipped = false;
                return { ...prev, memoryCards: resetCards, memoryFlippedIndices: [] };
            });
        }, 1000);
        setCurrentQuiz(prev => prev ? { ...prev, memoryCards: cards, memoryFlippedIndices: flipped} : null);
      }
    } else {
      setCurrentQuiz(prev => prev ? { ...prev, memoryCards: cards, memoryFlippedIndices: flipped } : null);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedSubjectForManage || !newTopic.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const prompt = PROMPTS.GENERATE_QUESTIONS(newTopic, 5);
      const response = await callGeminiAI(prompt, appData.settings.geminiApiKey, appData.settings.aiModel);
      
      // Clean the response to get valid JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('AI không trả về định dạng JSON hợp lệ.');
      
      const newQuestions: any[] = JSON.parse(jsonMatch[0]);
      const formattedQuestions: Question[] = newQuestions.map(q => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        subjectId: selectedSubjectForManage.id
      }));
      
      setAppData(prev => ({
        ...prev,
        questions: [...prev.questions, ...formattedQuestions],
        subjects: prev.subjects.map(s => 
          s.id === selectedSubjectForManage.id 
            ? { ...s, questionsCount: s.questionsCount + formattedQuestions.length } 
            : s
        )
      }));
      
      setNewTopic('');
      alert(`Đã tạo thành công ${formattedQuestions.length} câu hỏi mới!`);
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    
    setAppData(prev => {
      const question = prev.questions.find(q => q.id === id);
      if (!question) return prev;
      
      return {
        ...prev,
        questions: prev.questions.filter(q => q.id !== id),
        subjects: prev.subjects.map(s => 
          s.id === question.subjectId 
            ? { ...s, questionsCount: Math.max(0, s.questionsCount - 1) } 
            : s
        )
      };
    });
  };
  const handleTutorSend = async () => {
    if (!tutorInput.trim() || isTutorLoading) return;
    
    const userMsg = tutorInput.trim();
    setTutorMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTutorInput('');
    setIsTutorLoading(true);
    
    try {
      const response = await callGeminiAI(
        PROMPTS.AI_TUTOR(userMsg), 
        appData.settings.geminiApiKey,
        appData.settings.aiModel
      );
      setTutorMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error: any) {
      setTutorMessages(prev => [...prev, { role: 'ai', text: `Lỗi: ${error.message}` }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  // --- Render Helpers ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Tổng bài thi" 
          value={appData.progress.totalAttempts} 
          icon={GraduationCap} 
          color="bg-primary" 
        />
        <StatCard 
          label="Điểm trung bình" 
          value={`${appData.progress.averageScore}%`} 
          icon={Award} 
          color="bg-secondary" 
        />
        <StatCard 
          label="Chuỗi ngày" 
          value={appData.progress.streakDays} 
          icon={Zap} 
          color="bg-orange-500" 
        />
        <StatCard 
          label="Câu hỏi đã làm" 
          value={appData.sessions.reduce((acc, s) => acc + s.totalQuestions, 0)} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Môn học phổ biến</h2>
            <button 
              onClick={() => setActiveTab('subjects')}
              className="text-primary font-medium text-sm hover:underline"
            >
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {appData.subjects.slice(0, 4).map(subject => (
              <motion.div 
                key={subject.id}
                whileHover={{ y: -5 }}
                className="glass-card p-6 rounded-2xl cursor-pointer group"
                onClick={() => startQuiz(subject)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {subject.id === 'math' && <Calculator size={24} />}
                    {subject.id === 'science' && <FlaskConical size={24} />}
                    {subject.id === 'history' && <History size={24} />}
                    {subject.id === 'english' && <Languages size={24} />}
                    {!['math', 'science', 'history', 'english'].includes(subject.id) && <BookOpen size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{subject.name}</h3>
                    <p className="text-sm text-gray-500">{subject.questionsCount} câu hỏi</p>
                  </div>
                  <ChevronRight size={20} className="ml-auto text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Phân tích hiệu suất học tập</h2>
          <div className="space-y-6">
            
            {/* Custom Line Chart: Biểu đồ điểm số gần đây */}
            <div className="glass-card p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-500 mb-4">Lịch sử điểm (5 bài gần nhất)</h3>
              {appData.sessions.length === 0 ? (
                <div className="text-center py-6 text-gray-300">
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Chưa có dữ liệu</p>
                </div>
              ) : (
                <div className="relative h-40 w-full flex items-end justify-between pt-4">
                  {/* SVG Line Background */}
                  <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      points={appData.sessions.slice(0, 5).reverse().map((s, i) => `${i * 25}%,${100 - s.score}%`).join(' ')}
                      className="drop-shadow-md"
                    />
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4ADE80" /> {/* Emerald 400 */}
                        <stop offset="100%" stopColor="#3B82F6" /> {/* Blue 500 */}
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Data Points & X-Axis */}
                  {appData.sessions.slice(0, 5).reverse().map((session, idx) => (
                    <div key={idx} className="flex flex-col items-center relative z-10 w-1/5 group">
                      <div 
                        className="w-3 h-3 bg-white border-2 border-primary rounded-full mb-1 group-hover:scale-150 transition-transform shadow-sm"
                        style={{ transform: `translateY(-${session.score}%)`, marginTop: `-${session.score}%` }} 
                      />
                      <div className="absolute top-0 -translate-y-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {session.score}%
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium truncate w-full text-center mt-auto">
                        {new Date(session.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Radar / Bar Chart Replacement: Thống kê theo môn học */}
            <div className="glass-card p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-500 mb-4">Tỉ lệ chính xác theo môn</h3>
              {appData.sessions.length === 0 ? (
                <div className="text-center py-6 text-gray-300">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Hãy làm bài thi để xem phân tích</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Calculate average score per subject */}
                  {appData.subjects.slice(0, 4).map(subject => {
                    const subjectSessions = appData.sessions.filter(s => s.subjectId === subject.id);
                    const avgScore = subjectSessions.length > 0 
                      ? Math.round(subjectSessions.reduce((acc, s) => acc + s.score, 0) / subjectSessions.length) 
                      : 0;
                    
                    return (
                      <div key={subject.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-700">{subject.name}</span>
                          <span className={avgScore >= 80 ? 'text-emerald-500' : avgScore >= 50 ? 'text-amber-500' : 'text-gray-400'}>
                            {avgScore > 0 ? `${avgScore}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${avgScore}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full ${avgScore >= 80 ? 'bg-emerald-500' : avgScore >= 50 ? 'bg-amber-500' : 'bg-gray-300'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    if (!currentQuiz) return null;
    
    if (currentQuiz.isFinished) {
      const percentage = Math.round((currentQuiz.score / currentQuiz.questions.length) * 100);
      return (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in duration-500">
          <div className="relative inline-block">
            <div className="w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center">
              <div className="text-5xl font-black text-primary">{percentage}%</div>
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-secondary text-white p-3 rounded-full shadow-lg"
            >
              <Trophy size={32} />
            </motion.div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">Kết quả tuyệt vời!</h2>
            <p className="text-gray-500">Bạn đã hoàn thành bài thi môn {currentQuiz.subject.name}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
              <p className="text-xs font-medium uppercase tracking-wider mb-1">Đúng</p>
              <p className="text-2xl font-bold">{currentQuiz.score}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 text-red-600">
              <p className="text-xs font-medium uppercase tracking-wider mb-1">Sai</p>
              <p className="text-2xl font-bold">{currentQuiz.questions.length - currentQuiz.score}</p>
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 text-primary">
              <p className="text-xs font-medium uppercase tracking-wider mb-1">Thời gian</p>
              <p className="text-2xl font-bold">{Math.floor((Date.now() - currentQuiz.startTime) / 1000)}s</p>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setCurrentQuiz(null)}
              className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
            >
              Về trang chủ
            </button>
            <button 
              onClick={() => startQuiz(currentQuiz.subject)}
              className="flex-1 py-4 rounded-2xl gradient-bg text-white font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
            >
              Làm lại
            </button>
          </div>
        </div>
      );
    }

    const question = currentQuiz.questions[currentQuiz.currentIndex];
    const progress = ((currentQuiz.currentIndex + 1) / currentQuiz.questions.length) * 100;

    if (gameMode === 'gold-miner') {
      return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in duration-500">
          <div className="relative h-64 rounded-3xl bg-gradient-to-b from-sky-400 to-amber-800 overflow-hidden shadow-2xl border-4 border-white">
            {/* Sky */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white border-2 border-gray-600">
                <div className="w-1 h-8 bg-gray-400 animate-bounce origin-top" />
              </div>
              <p className="text-[10px] font-bold text-white mt-1 uppercase tracking-tighter">Thợ đào mỏ</p>
            </div>
            
            {/* Ground */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-amber-900/50 flex items-center justify-around px-10">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  className="text-3xl"
                >
                  {i % 2 === 0 ? '💰' : '💎'}
                </motion.div>
              ))}
            </div>

            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-white font-bold flex items-center gap-2">
              <Star size={18} className="text-yellow-400 fill-yellow-400" />
              <span>{currentQuiz.score * 100}</span>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-6 border-t-4 border-primary">
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Câu hỏi số {currentQuiz.currentIndex + 1}</p>
              <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                {question.content}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options?.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  className="p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all text-left flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-bold text-gray-700">{option}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (gameMode === 'memory' && currentQuiz.memoryCards) {
      return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in duration-500">
           <div className="flex items-center justify-between mb-8">
              <button onClick={() => setCurrentQuiz(null)} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                <ArrowLeft size={20} /> <span className="font-medium">Thoát</span>
              </button>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm text-primary font-bold flex items-center gap-2">
                 <Star size={18} /> {currentQuiz.score} Cặp trùng khớp
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentQuiz.memoryCards.map((card, idx) => (
                 <div 
                   key={idx} 
                   onClick={() => handleMemoryCardClick(idx)}
                   className={`h-32 perspective-1000 cursor-pointer ${card.isMatched ? 'opacity-0 pointer-events-none transition-opacity duration-500 delay-300' : ''}`}
                 >
                   <motion.div 
                     animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                     transition={{ duration: 0.4 }}
                     className="w-full h-full relative preserve-3d"
                   >
                     {/* Front (Hidden) */}
                     <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md border-2 border-indigo-400 flex items-center justify-center text-white">
                        <Sparkles size={32} className="opacity-50" />
                     </div>
                     {/* Back (Revealed) */}
                     <div 
                        className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg border-2 border-primary/20 flex items-center justify-center p-4 text-center overflow-hidden rotate-y-180"
                     >
                        <span className={`font-bold text-sm ${card.type === 'q' ? 'text-gray-800' : 'text-primary'}`}>
                          {card.text}
                        </span>
                     </div>
                   </motion.div>
                 </div>
              ))}
           </div>
        </div>
      );
    }

    if (gameMode === 'speed') {
      return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentQuiz(null)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Thoát</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold border border-red-100">
                 <Timer size={20} className={currentQuiz.speedTimeLeft! <= 3 ? 'animate-bounce' : ''} />
                 <span className="text-xl">{currentQuiz.speedTimeLeft}s</span>
              </div>
            </div>
          </div>
  
          <div className="glass-card p-8 rounded-3xl space-y-8 border-t-4 border-red-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
               <motion.div 
                 initial={{ width: '100%' }}
                 animate={{ width: `${(currentQuiz.speedTimeLeft! / 10) * 100}%` }}
                 transition={{ duration: 1, ease: "linear" }}
                 className="h-full bg-red-500"
               />
            </div>
            <div className="text-center space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                <Zap size={14} /> Hỏi Nhanh Đáp Gọn
              </div>
              <h2 className="text-3xl font-black text-gray-800 leading-tight">
                {question.content}
              </h2>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className="flex items-center justify-center p-6 rounded-2xl border-2 border-gray-100 bg-white hover:border-red-500 hover:bg-red-50 hover:text-red-700 hover:scale-105 active:scale-95 text-center transition-all group font-bold text-gray-700 text-lg shadow-sm"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentQuiz(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Thoát</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Câu hỏi</p>
              <p className="font-bold text-gray-800">{currentQuiz.currentIndex + 1} / {currentQuiz.questions.length}</p>
            </div>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <BrainCircuit size={14} />
              <span>{question.difficulty}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 leading-tight">
              {question.content}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {question.options?.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleAnswer(option)}
                className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-lg font-medium text-gray-700">{option}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderManage = () => {
    if (!selectedSubjectForManage) return null;
    const subjectQuestions = appData.questions.filter(q => q.subjectId === selectedSubjectForManage.id);

    return (
      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { setActiveTab('subjects'); setSelectedSubjectForManage(null); }}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Quay lại</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 hidden sm:block">Quản lý: {selectedSubjectForManage.name}</h2>
            <button 
              onClick={() => exportQuestionsToWord(selectedSubjectForManage.name, subjectQuestions)}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold flex items-center gap-2"
              title="Xuất ra file Word (.doc)"
            >
              <Save size={18} />
              Xuất Word
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-secondary" />
                Tạo câu hỏi bằng AI
              </h3>
              <p className="text-sm text-gray-500">Nhập chủ đề cụ thể để AI tự động soạn câu hỏi cho bạn.</p>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ví dụ: Đạo hàm cấp 1, Thì hiện tại đơn..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <button 
                  onClick={handleGenerateQuestions}
                  disabled={!newTopic.trim() || isGenerating}
                  className="w-full py-3 gradient-bg text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Soạn câu hỏi AI
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-800">Danh sách câu hỏi ({subjectQuestions.length})</h3>
            <div className="space-y-4">
              {subjectQuestions.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400">Chưa có câu hỏi nào. Hãy thử tạo bằng AI!</p>
                </div>
              ) : (
                subjectQuestions.map((q, idx) => (
                  <div key={q.id} className="glass-card p-5 rounded-2xl flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-2">{q.content}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options?.map((opt, i) => (
                          <span key={i} className={`text-[10px] px-2 py-1 rounded-md ${opt === q.correctAnswer ? 'bg-emerald-100 text-emerald-600 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingQuestion(q)}
                        className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                        title="Sửa câu hỏi"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClasses = () => {
    if (appData.currentUser?.role !== 'teacher') return null;

    const teacherClasses = (appData.classrooms || []).filter(c => c.teacherId === appData.currentUser?.id);

    const handleCreateClass = () => {
      if (!newClassName.trim()) return;
      const newClassCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newClassroom: Classroom = {
        id: Math.random().toString(36).substr(2, 9),
        name: newClassName,
        code: newClassCode,
        teacherId: appData.currentUser!.id,
        students: []
      };
      
      setAppData(prev => ({
        ...prev,
        classrooms: [...(prev.classrooms || []), newClassroom]
      }));
      setNewClassName('');
    };

    return (
      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Lớp học</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Plus size={18} className="text-primary" />
                Tạo lớp học mới
              </h3>
              <p className="text-sm text-gray-500">Nhập tên lớp để tạo mã tham gia cho học sinh.</p>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp Toán 10A1..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <button 
                  onClick={handleCreateClass}
                  disabled={!newClassName.trim()}
                  className="w-full py-3 gradient-bg text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all font-medium"
                >
                  <Plus size={18} />
                  Tạo lớp học
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-gray-800">Danh sách lớp học của bạn ({teacherClasses.length})</h3>
            <div className="space-y-6">
              {teacherClasses.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400">Bạn chưa tạo lớp học nào.</p>
                </div>
              ) : (
                teacherClasses.map((cls) => (
                  <div key={cls.id} className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                       <div>
                         <h4 className="text-xl font-bold text-gray-800">{cls.name}</h4>
                         <p className="text-sm text-gray-500 mt-1">Học sinh tham gia: {cls.students.length}</p>
                       </div>
                       <div className="bg-primary/10 px-4 py-2 rounded-xl text-center border-2 border-primary/20">
                         <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Mã Lớp</p>
                         <p className="font-mono text-xl font-black text-gray-800 tracking-widest">{cls.code}</p>
                       </div>
                    </div>
                    <div>
                      {cls.students.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Chưa có học sinh nào tham gia.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {cls.students.map((student, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-bold">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{student.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTutor = () => (
    <div className="h-[calc(100vh-12rem)] flex flex-col glass-card rounded-3xl overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 bg-primary text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="font-bold">Gia sư AI EduGame</h2>
            <p className="text-xs text-white/70">Luôn sẵn sàng hỗ trợ bạn 24/7</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Trực tuyến</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {tutorMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
            <div className="p-6 bg-gray-50 rounded-full">
              <Sparkles size={48} className="text-primary/30" />
            </div>
            <div className="max-w-xs">
              <p className="font-bold text-gray-600">Chào mừng bạn!</p>
              <p className="text-sm">Hãy đặt câu hỏi về bất kỳ chủ đề nào bạn đang học, mình sẽ giải đáp tận tình.</p>
            </div>
          </div>
        )}
        {tutorMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTutorLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-sm text-gray-500">Đang suy nghĩ...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={tutorInput}
            onChange={(e) => setTutorInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTutorSend()}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <button 
            onClick={handleTutorSend}
            disabled={!tutorInput.trim() || isTutorLoading}
            className="p-3 bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderShareModal = () => (
    <AnimatePresence>
      {showShareModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-primary/20">
              <Share2 size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">Chia sẻ phòng học</h2>
              <p className="text-sm text-gray-500">Gửi mã này cho học sinh để tham gia bài thi ngay lập tức.</p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-primary/30">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Mã phòng</p>
              <p className="text-4xl font-black text-gray-800 tracking-[0.5em]">{roomCode}</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${roomCode}`);
                  alert('Đã sao chép đường dẫn tham gia!');
                }}
                className="flex-1 py-3 gradient-bg text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Sao chép link
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  const renderSettings = () => (
    <AnimatePresence>
      {showSettings && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Cài đặt hệ thống</h2>
              {appData.settings.geminiApiKey && (
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-primary" />
                    Gemini API Key
                  </div>
                  <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    Lấy Key tại đây
                  </a>
                </label>
                <div className="relative">
                  <input 
                    type={showApiKey ? "text" : "password"}
                    value={appData.settings.geminiApiKey}
                    onChange={(e) => setAppData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, geminiApiKey: e.target.value }
                    }))}
                    placeholder="Nhập API Key của bạn..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all pr-12"
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">API Key được lưu trữ an toàn trong LocalStorage của trình duyệt.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Mô hình AI</label>
                <select 
                  value={appData.settings.aiModel}
                  onChange={(e) => setAppData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, aiModel: e.target.value }
                  }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all appearance-none bg-white"
                >
                  {AI_MODELS.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-primary">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Âm thanh</p>
                    <p className="text-xs text-gray-500">Hiệu ứng khi làm bài</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAppData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${appData.settings.soundEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appData.settings.soundEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              {appData.settings.geminiApiKey && (
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
              )}
              <button 
                onClick={() => {
                  if (!appData.settings.geminiApiKey) {
                    alert('Vui lòng nhập API Key để tiếp tục sử dụng ứng dụng!');
                    return;
                  }
                  setShowSettings(false);
                }}
                className="flex-1 py-3 gradient-bg text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Lưu cài đặt & Bắt đầu
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderLogin = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [loginName, setLoginName] = useState('');
    const [loginRole, setLoginRole] = useState<UserRole>('student');
    const [loginClassCode, setLoginClassCode] = useState('');

    const handleLogin = () => {
      if (!loginName.trim()) {
        alert('Vui lòng nhập tên của bạn!');
        return;
      }
      
      const users = appData.users || [];
      const existingUser = users.find(u => u.name === loginName.trim() && u.role === loginRole);

      if (isLoginMode) {
        if (!existingUser) {
           alert('Tài khoản không tồn tại. Vui lòng kiểm tra lại họ tên hoặc đăng ký tài khoản mới!');
           return;
        }

        if (loginRole === 'student') {
          if (!loginClassCode.trim()) {
            alert('Học sinh vui lòng nhập mã Lớp học để đăng nhập!');
            return;
          }
          const targetClass = appData.classrooms?.find(c => c.code === loginClassCode.trim().toUpperCase());
          if (!targetClass) {
            alert('Không tìm thấy Lớp học với mã này!');
            return;
          }
        }

        setAppData(prev => ({ ...prev, currentUser: existingUser }));
      } else {
        // Register Mode
        if (existingUser) {
           alert('Tên tài khoản này đã tồn tại. Vui lòng chọn tên khác hoặc chuyển sang Đăng nhập!');
           return;
        }

        let finalClassCode = '';
        if (loginRole === 'student') {
          if (!loginClassCode.trim()) {
            alert('Học sinh vui lòng nhập mã Lớp học (Được GV cung cấp) để tham gia!');
            return;
          }
          
          const targetClass = appData.classrooms?.find(c => c.code === loginClassCode.trim().toUpperCase());
          if (!targetClass) {
            alert('Không tìm thấy Lớp học với mã này!');
            return;
          }
          finalClassCode = targetClass.code;
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: loginName.trim(),
          role: loginRole,
          classCode: finalClassCode || undefined
        };
        
        setAppData(prev => {
           let updatedClassrooms = prev.classrooms || [];
           let updatedUsers = [...(prev.users || []), newUser];

           if (loginRole === 'student' && finalClassCode) {
              const targetClass = updatedClassrooms.find(c => c.code === finalClassCode);
              if (targetClass) {
                  const studentExists = targetClass.students.some(s => s.name === newUser.name);
                  if (!studentExists) {
                      const newStudent = { id: newUser.id, name: newUser.name, joinedAt: new Date().toISOString() };
                      updatedClassrooms = updatedClassrooms.map(c => 
                          c.code === targetClass.code 
                          ? { ...c, students: [...c.students, newStudent] }
                          : c
                      );
                  }
              }
           }
           return {
             ...prev,
             users: updatedUsers,
             classrooms: updatedClassrooms,
             currentUser: newUser
           };
        });
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light p-4 animate-in fade-in duration-500">
        <div className="max-w-md w-full glass-card p-8 rounded-3xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full -ml-12 -mb-12" />
          
          <div className="relative z-10 text-center space-y-2">
            <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 mx-auto mb-6">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">EduGame</h1>
            <p className="text-gray-500 font-medium">Nền tảng học tập thông minh AI</p>
          </div>

          <div className="relative z-10 space-y-6">
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLoginMode ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Đăng nhập
              </button>
              <button 
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLoginMode ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tạo tài khoản
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700">Bạn là ai?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLoginRole('student')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    loginRole === 'student' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-primary/30'
                  }`}
                >
                  <div className={`p-3 rounded-full ${loginRole === 'student' ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                    <GraduationCap size={24} />
                  </div>
                  <span className="font-bold">Học sinh</span>
                </button>
                <button
                  onClick={() => setLoginRole('teacher')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    loginRole === 'teacher' 
                      ? 'border-secondary bg-secondary/5 text-secondary' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-secondary/30'
                  }`}
                >
                  <div className={`p-3 rounded-full ${loginRole === 'teacher' ? 'bg-secondary text-white' : 'bg-gray-100'}`}>
                    <BookOpen size={24} />
                  </div>
                  <span className="font-bold">Giáo viên</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tên tài khoản</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder={loginRole === 'teacher' ? "Ví dụ: Cô Lan Toán..." : "Ví dụ: Nguyễn Văn A..."}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium text-gray-800"
                />
              </div>

              {loginRole === 'student' && (
                <div className="space-y-2 translate-y-0 opacity-100 transition-all">
                  <label className="text-sm font-bold text-gray-700">Mã lớp học</label>
                  <input
                    type="text"
                    value={loginClassCode}
                    onChange={(e) => setLoginClassCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Nhập mã lớp do giáo viên cung cấp..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium text-gray-800 uppercase"
                  />
                  <p className="text-xs text-gray-400">Yêu cầu phải có mã lớp {isLoginMode ? 'để vào học.' : 'để đăng ký mới.'}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-4 gradient-bg text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 text-lg"
            >
              {isLoginMode ? 'Đăng nhập vào App' : 'Đăng ký Tài khoản'} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveEditQuestion = () => {
    if (!editingQuestion) return;
    setAppData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === editingQuestion.id ? editingQuestion : q)
    }));
    setEditingQuestion(null);
  };

  const renderEditQuestionModal = () => (
    <AnimatePresence>
      {editingQuestion && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sửa câu hỏi</h2>
              <button onClick={() => setEditingQuestion(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <textarea
                value={editingQuestion.content}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 text-sm"
                rows={3}
              />
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">Các đáp án:</p>
                {editingQuestion.options?.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(editingQuestion.options || [])];
                        newOptions[i] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOptions });
                      }}
                      className="flex-1 p-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <input 
                      type="radio" 
                      name="correctAnswer" 
                      checked={opt === editingQuestion.correctAnswer}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: opt })}
                      title="Chọn làm đáp án đúng"
                    />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleSaveEditQuestion}
                className="w-full py-3 gradient-bg text-white rounded-xl font-bold hover:opacity-90 transition-all"
              >
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderGameSelectionModal = () => (
    <AnimatePresence>
      {selectedGameForSubject && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Chọn môn học</h2>
              <button onClick={() => setSelectedGameForSubject(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {appData.subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => {
                    startQuiz(subject, selectedGameForSubject);
                    setSelectedGameForSubject(null);
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
                >
                  <span className="font-bold text-gray-700 group-hover:text-primary">{subject.name}</span>
                  <span className="text-xs text-gray-400">{subject.questionsCount} câu</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!appData.currentUser) {
    return renderLogin();
  }

  return (
    <div className="min-h-screen flex bg-bg-light">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <GraduationCap size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-800">EduGame</span>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Tổng quan" 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={BookOpen} 
              label="Môn học" 
              active={activeTab === 'subjects'} 
              onClick={() => { setActiveTab('subjects'); setSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={Gamepad2} 
              label="Trò chơi" 
              active={activeTab === 'games'} 
              onClick={() => { setActiveTab('games'); setSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={Trophy} 
              label="Xếp hạng" 
              active={activeTab === 'leaderboard'} 
              onClick={() => { setActiveTab('leaderboard'); setSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={BrainCircuit} 
              label="Gia sư AI" 
              active={activeTab === 'tutor'} 
              onClick={() => { setActiveTab('tutor'); setSidebarOpen(false); }} 
            />
            {appData.currentUser?.role === 'teacher' && (
              <>
                <SidebarItem 
                  icon={Settings} 
                  label="Quản lý" 
                  active={activeTab === 'manage'} 
                  onClick={() => { setActiveTab('subjects'); setSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={Users} 
                  label="Lớp học" 
                  active={activeTab === 'classes'} 
                  onClick={() => { setActiveTab('classes'); setSidebarOpen(false); }} 
                />
              </>
            )}
          </nav>

          <div className="mt-auto p-4 bg-gray-50 rounded-2xl space-y-3 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                  {appData.currentUser?.name.charAt(0).toUpperCase() || <Star size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{appData.currentUser?.name || "Người dùng"}</p>
                  <p className="text-xs text-primary font-medium">{appData.currentUser?.role === 'teacher' ? '👨‍🏫 Giáo viên' : '🎓 Học sinh'}</p>
                </div>
              </div>
              <button 
                onClick={() => setAppData(prev => ({ ...prev, currentUser: null }))}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <XCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={
            activeTab === 'dashboard' ? 'Tổng quan' :
            activeTab === 'subjects' ? 'Kho môn học' :
            activeTab === 'games' ? 'Kịch bản trò chơi' :
            activeTab === 'leaderboard' ? 'Bảng xếp hạng' : 
            activeTab === 'manage' ? 'Quản lý câu hỏi' : 
            activeTab === 'classes' ? 'Quản lý lớp học' : 'Gia sư AI'
          }
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          openSettings={() => setShowSettings(true)}
          hasApiKey={!!appData.settings.geminiApiKey}
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {currentQuiz ? renderQuiz() : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'manage' && renderManage()}
              {activeTab === 'classes' && renderClasses()}
              {activeTab === 'subjects' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {appData.subjects.map(subject => (
                    <motion.div 
                      key={subject.id}
                      whileHover={{ y: -8 }}
                      className="glass-card p-6 rounded-3xl cursor-pointer group relative overflow-hidden"
                      onClick={() => startQuiz(subject)}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                      <div className="relative z-10 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          {subject.id === 'math' && <Calculator size={32} />}
                          {subject.id === 'science' && <FlaskConical size={32} />}
                          {subject.id === 'history' && <History size={32} />}
                          {subject.id === 'english' && <Languages size={32} />}
                          {!['math', 'science', 'history', 'english'].includes(subject.id) && <BookOpen size={32} />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
                          <p className="text-sm text-gray-500">{subject.questionsCount} câu hỏi đã sẵn sàng</p>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); startQuiz(subject); }}
                            className="flex-1 py-2 rounded-xl gradient-bg text-white text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <Play size={14} fill="currentColor" />
                            Học ngay
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedSubjectForManage(subject);
                              setActiveTab('manage');
                            }}
                            className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary transition-all"
                            title="Quản lý câu hỏi"
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleShare(subject);
                            }}
                            className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary transition-all"
                            title="Chia sẻ"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <motion.div 
                    whileHover={{ y: -8 }}
                    className="border-2 border-dashed border-gray-200 p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                      <Plus size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-600 group-hover:text-primary">Thêm môn học</h3>
                      <p className="text-xs text-gray-400">Tạo kho câu hỏi mới</p>
                    </div>
                  </motion.div>
                </div>
              )}
              {activeTab === 'games' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {[
                    { title: 'Vua Trắc Nghiệm', desc: 'Thử thách kiến thức qua các câu chuyện và câu hỏi.', icon: '🧠', color: 'from-emerald-400 to-green-500', mode: 'quiz' },
                    { title: 'Đào vàng kiến thức', desc: 'Trả lời đúng để kéo vàng, trả lời sai sẽ bốc phải đá!', icon: '⛏️', color: 'from-yellow-400 to-orange-500', mode: 'gold-miner' },
                    { title: 'Lật thẻ trí nhớ', desc: 'Rèn luyện ghi nhớ qua việc tìm cặp thẻ (Câu hỏi - Đáp án)', icon: '✨', color: 'from-indigo-400 to-purple-500', mode: 'memory' },
                    { title: 'Hỏi nhanh đáp gọn', desc: 'Chạy đua với áp lực thời gian. 10 giây quyết định!', icon: '⚡', color: 'from-red-400 to-rose-500', mode: 'speed' },
                  ].map((game, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="relative h-64 rounded-3xl overflow-hidden shadow-xl group cursor-pointer"
                      onClick={() => {
                        setSelectedGameForSubject(game.mode as any);
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90`} />
                      <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                        <div className="text-5xl mb-4 animate-float">{game.icon}</div>
                        <h3 className="text-2xl font-black mb-2">{game.title}</h3>
                        <p className="text-white/80 text-sm max-w-xs">{game.desc}</p>
                        <div className="mt-6 flex items-center gap-2 font-bold">
                          <Play size={20} fill="currentColor" />
                          <span>Chơi ngay</span>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white">
                        Hot Game
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {activeTab === 'leaderboard' && (
                <div className="max-w-4xl mx-auto glass-card rounded-3xl overflow-hidden animate-in fade-in duration-500">
                  <div className="p-8 gradient-bg text-white flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Bảng xếp hạng</h2>
                      <p className="text-white/70">Những học sinh xuất sắc nhất tuần này</p>
                    </div>
                    <Trophy size={48} className="opacity-50" />
                  </div>
                  <div className="p-4">
                    {[
                      { name: 'Nguyễn Văn A', score: 2450, level: 15, avatar: 'https://picsum.photos/seed/1/100/100' },
                      { name: 'Trần Thị B', score: 2320, level: 14, avatar: 'https://picsum.photos/seed/2/100/100' },
                      { name: 'Lê Văn C', score: 2100, level: 13, avatar: 'https://picsum.photos/seed/3/100/100' },
                      { name: 'Phạm Thị D', score: 1950, level: 12, avatar: 'https://picsum.photos/seed/4/100/100' },
                      { name: 'Hoàng Văn E', score: 1800, level: 11, avatar: 'https://picsum.photos/seed/5/100/100' },
                    ].map((user, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                        <div className={`w-8 h-8 flex items-center justify-center font-black ${idx === 0 ? 'text-yellow-500 text-xl' : idx === 1 ? 'text-gray-400 text-lg' : idx === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                          {idx + 1}
                        </div>
                        <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">Cấp độ {user.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-primary">{user.score}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Điểm</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'tutor' && renderTutor()}
            </>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {renderSettings()}

      {/* Share Modal */}
      {renderShareModal()}

      {/* Game Selection Modal */}
      {renderGameSelectionModal()}

      {/* Edit Question Modal */}
      {renderEditQuestionModal()}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

