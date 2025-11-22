import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Keyboard, Award, Activity, MessageSquare, X, GraduationCap, Trash2, Check, ChevronRight } from 'lucide-react';
import { AppMode, DifficultyLevel, LessonData, TypingResult } from './types';
import { generateAdaptiveLesson, generateInitialLesson } from './services/geminiService';
import VirtualKeyboard from './components/VirtualKeyboard';
import TypingCanvas from './components/TypingCanvas';
import StatsDisplay from './components/StatsDisplay';
import StudyTimer from './components/StudyTimer';

const App: React.FC = () => {
  // State with Persistence
  const [mode, setMode] = useState<AppMode>(() => {
    // Optional: could persist mode too, but defaulting to SIANG for now as per original
    return AppMode.SIANG;
  });
  
  const [level, setLevel] = useState<DifficultyLevel>(() => {
    const saved = localStorage.getItem('app_level');
    return (saved as DifficultyLevel) || DifficultyLevel.PEMULA;
  });

  const [history, setHistory] = useState<TypingResult[]>(() => {
    const saved = localStorage.getItem('app_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [keyMastery, setKeyMastery] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('app_key_mastery');
    return saved ? JSON.parse(saved) : {};
  });

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // UI State
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(true);
  const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
  
  const messagePopupRef = useRef<HTMLDivElement>(null);
  const levelMenuRef = useRef<HTMLDivElement>(null);

  // Derived Theme
  const isDark = mode === AppMode.MALAM;

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('app_level', level);
  }, [level]);

  useEffect(() => {
    localStorage.setItem('app_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('app_key_mastery', JSON.stringify(keyMastery));
  }, [keyMastery]);

  // Initialize Lesson
  useEffect(() => {
    const init = async () => {
      // If we have history, generate adaptive lesson immediately
      if (history.length > 0) {
        const lastResult = history[history.length - 1];
        // We need a dummy target text if we are reloading, or we can just generate a generic start for the current level
        // For simplicity on reload, we generate a new lesson based on the last result
        const newLesson = await generateAdaptiveLesson(level, mode, lastResult, lastResult.actualTypedText); // Using actual text as context
        setLesson(newLesson);
      } else {
        const initialLesson = await generateInitialLesson();
        setLesson(initialLesson);
      }
      setIsLoading(false);
      if (history.length === 0) setIsMessageOpen(true);
    };
    init();
  }, []); // Run once on mount

  // Auto-close message notification after 8 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isMessageOpen) {
      timer = setTimeout(() => {
        setIsMessageOpen(false);
      }, 8000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isMessageOpen]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (levelMenuRef.current && !levelMenuRef.current.contains(event.target as Node)) {
        setIsLevelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle Theme
  const toggleMode = () => {
    setMode(prev => prev === AppMode.SIANG ? AppMode.MALAM : AppMode.SIANG);
    document.documentElement.classList.toggle('dark');
  };

  const handleResetProgress = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua riwayat latihan dan kembali ke level Pemula?')) {
      localStorage.removeItem('app_level');
      localStorage.removeItem('app_history');
      localStorage.removeItem('app_key_mastery');
      localStorage.removeItem('study_timer_elapsed');
      // We keep timer target settings generally, but clear progress
      
      setLevel(DifficultyLevel.PEMULA);
      setHistory([]);
      setKeyMastery({});
      window.location.reload();
    }
  };

  // Handle Typing Start
  const handleTypingStart = () => {
    setIsTimerRunning(true);
    if (isMessageOpen) setIsMessageOpen(false);
    setHasUnreadMessage(false);
    setIsLevelMenuOpen(false);
  };

  // Update Key Mastery Score
  const updateMastery = (target: string, typed: string) => {
    const newMastery = { ...keyMastery };
    const length = Math.min(target.length, typed.length);

    for (let i = 0; i < length; i++) {
      const char = target[i].toLowerCase();
      if (!/[a-z0-9]/.test(char)) continue; // Skip special chars for basic mastery for now

      const currentScore = newMastery[char] || 0;
      
      if (target[i] === typed[i]) {
        // Correct: Small increment
        newMastery[char] = Math.min(100, currentScore + 2);
      } else {
        // Incorrect: Larger decrement
        newMastery[char] = Math.max(0, currentScore - 5);
      }
    }
    setKeyMastery(newMastery);
  };

  // Handle Typing completion
  const handleSessionComplete = async (result: TypingResult) => {
    setIsTimerRunning(false);
    setIsLoading(true);
    setHistory(prev => [...prev, result]);

    // Update Mastery
    if (lesson) {
      updateMastery(lesson.lessonText, result.actualTypedText);
    }

    // Gemini Call
    if (lesson) {
      const nextLessonData = await generateAdaptiveLesson(
        level,
        mode,
        result,
        lesson.lessonText
      );
      
      setLevel(nextLessonData.nextLevel);
      setLesson(nextLessonData);
      
      setHasUnreadMessage(true);
      setIsMessageOpen(true);
    }
    
    setIsLoading(false);
  };

  const handleCharTyped = (char: string) => {
    setActiveKey(char);
    setTimeout(() => setActiveKey(null), 150);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${isDark ? 'bg-night-bg text-night-text' : 'bg-day-bg text-day-text'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center ${isDark ? 'border-slate-800 bg-night-bg/80' : 'border-gray-200 bg-day-bg/80'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-night-primary text-white' : 'bg-day-primary text-white'}`}>
            <Keyboard size={20} />
          </div>
          <h1 className="font-bold text-lg leading-tight hidden sm:block">Guru Ketik Adaptif</h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 relative">
            
            {/* Level Menu Dropdown */}
            <div className="relative" ref={levelMenuRef}>
              <button 
                onClick={() => setIsLevelMenuOpen(!isLevelMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  isDark ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                 <GraduationCap size={18} className={isDark ? 'text-night-secondary' : 'text-day-primary'} /> 
                 <span className="text-xs font-bold hidden sm:inline">{level}</span>
                 <ChevronRight size={14} className={`transform transition-transform ${isLevelMenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {isLevelMenuOpen && (
                <div className={`absolute top-full right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
                }`}>
                  <div className="p-2 border-b border-opacity-10">
                     <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider px-2">Jenjang Level</span>
                  </div>
                  <div className="p-1">
                    {[DifficultyLevel.PEMULA, DifficultyLevel.MENENGAH, DifficultyLevel.MAHIR].map((l) => (
                      <div key={l} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                        level === l 
                          ? (isDark ? 'bg-night-primary/20 text-night-primary' : 'bg-day-primary/10 text-day-primary') 
                          : 'opacity-70'
                      }`}>
                        <span>{l}</span>
                        {level === l && <Check size={14} />}
                      </div>
                    ))}
                  </div>
                  <div className={`p-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                    <button 
                      onClick={handleResetProgress}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                      Reset Progres
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* WPM Stat */}
            <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/60 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
               <Activity size={18} className={isDark ? 'text-night-secondary' : 'text-day-primary'} /> 
               <span className="text-xs font-bold whitespace-nowrap">
                 WPM: {history.length > 0 ? history[history.length-1].wpm : '--'}
               </span>
            </div>

            {/* Message Icon */}
            <div className="relative" ref={messagePopupRef}>
              <button 
                onClick={() => {
                  setIsMessageOpen(!isMessageOpen);
                  if (!isMessageOpen) setHasUnreadMessage(false);
                }}
                className={`relative p-2 rounded-full transition-all duration-200 ${
                  isMessageOpen 
                    ? (isDark ? 'bg-slate-700 text-white' : 'bg-orange-100 text-orange-600') 
                    : (isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500')
                }`}
              >
                <MessageSquare size={20} />
                {hasUnreadMessage && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-bounce"></span>
                )}
              </button>

              {/* Message Popup */}
              {isMessageOpen && (
                <div className={`absolute top-full right-0 mt-3 w-80 sm:w-96 p-4 rounded-2xl shadow-xl border transform transition-all z-50 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-100 text-gray-700'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-night-secondary' : 'text-day-primary'}`}>
                      <MessageSquare size={14} />
                      Pesan Guru Gemini
                    </h3>
                    <button 
                      onClick={() => setIsMessageOpen(false)}
                      className={`p-1 rounded-full hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                     {isLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className={`h-3 w-3/4 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                          <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                        </div>
                     ) : (
                        lesson?.tutorMessage || "Siap untuk latihan?"
                     )}
                  </div>
                  <div className={`absolute -top-1.5 right-3 w-3 h-3 transform rotate-45 border-t border-l ${
                     isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
                  }`}></div>
                </div>
              )}
            </div>

            <div className={`h-6 w-px ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>

            <button 
              onClick={toggleMode}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-orange-100 text-orange-500'}`}
            >
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            
            <section className="space-y-2">
               <div className="flex justify-between items-end px-1">
                  <h3 className="font-bold text-sm opacity-75">Latihan Anda</h3>
                  {isLoading && <span className="text-[10px] animate-pulse text-day-primary">Sedang menyiapkan materi baru...</span>}
               </div>
               
               {lesson && !isLoading && (
                 <TypingCanvas 
                   targetText={lesson.lessonText} 
                   onComplete={handleSessionComplete}
                   onCharTyped={handleCharTyped}
                   onTypingStart={handleTypingStart}
                   isDark={isDark}
                 />
               )}
               
               {isLoading && (
                 <div className={`w-full h-32 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <span className="text-sm opacity-50">Memuat latihan...</span>
                 </div>
               )}
            </section>

            <section className="w-full">
               <h3 className="font-bold text-sm opacity-75 mb-2 px-1">Panduan Visual</h3>
               <VirtualKeyboard 
                  activeKey={activeKey} 
                  criticalKeys={lesson?.criticalKeys || []} 
                  keyMastery={keyMastery}
                  isDark={isDark}
               />
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 sticky top-24">
             <StudyTimer isDark={isDark} isRunning={isTimerRunning} />

             <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                <StatsDisplay history={history} isDark={isDark} />
             </div>
             
             <div className={`mt-4 p-4 rounded-xl text-xs leading-relaxed opacity-75 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <p><strong>Tips:</strong> Fokus pada akurasi sebelum kecepatan. Tombol keyboard akan berubah warna dari merah ke hijau seiring peningkatan kemahiran Anda.</p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;