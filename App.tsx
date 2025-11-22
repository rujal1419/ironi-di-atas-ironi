import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Keyboard, Award, Activity, MessageSquare, X } from 'lucide-react';
import { AppMode, DifficultyLevel, LessonData, TypingResult } from './types';
import { generateAdaptiveLesson, generateInitialLesson } from './services/geminiService';
import VirtualKeyboard from './components/VirtualKeyboard';
import TypingCanvas from './components/TypingCanvas';
import StatsDisplay from './components/StatsDisplay';
import StudyTimer from './components/StudyTimer';

const App: React.FC = () => {
  // State
  const [mode, setMode] = useState<AppMode>(AppMode.SIANG);
  const [level, setLevel] = useState<DifficultyLevel>(DifficultyLevel.PEMULA);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [history, setHistory] = useState<TypingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Message / Notification State
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(true); // Initial welcome message is unread
  const messagePopupRef = useRef<HTMLDivElement>(null);

  // Derived Theme
  const isDark = mode === AppMode.MALAM;

  // Initialize
  useEffect(() => {
    const init = async () => {
      const initialLesson = await generateInitialLesson();
      setLesson(initialLesson);
      setIsLoading(false);
      // Auto show welcome message
      setIsMessageOpen(true);
    };
    init();
  }, []);

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

  // Toggle Theme
  const toggleMode = () => {
    setMode(prev => prev === AppMode.SIANG ? AppMode.MALAM : AppMode.SIANG);
    document.documentElement.classList.toggle('dark');
  };

  // Toggle Message Popup
  const toggleMessage = () => {
    if (!isMessageOpen) {
      setHasUnreadMessage(false);
    }
    setIsMessageOpen(!isMessageOpen);
  };

  // Handle Typing Start
  const handleTypingStart = () => {
    setIsTimerRunning(true);
    // Close message if they start typing
    if (isMessageOpen) setIsMessageOpen(false);
    setHasUnreadMessage(false);
  };

  // Handle Typing completion
  const handleSessionComplete = async (result: TypingResult) => {
    setIsTimerRunning(false); // Stop timer
    setIsLoading(true);
    setHistory(prev => [...prev, result]);

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
      
      // Trigger Notification Pop-up
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
      
      {/* Header / Persistent CTA */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center ${isDark ? 'border-slate-800 bg-night-bg/80' : 'border-gray-200 bg-day-bg/80'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-night-primary text-white' : 'bg-day-primary text-white'}`}>
            <Keyboard size={20} />
          </div>
          <h1 className="font-bold text-lg leading-tight hidden sm:block">Guru Ketik Adaptif</h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 relative">
            {/* Stats Pills - Styled to match Message Icon */}
            <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/60 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
               <Award size={18} className={isDark ? 'text-night-secondary' : 'text-day-primary'} /> 
               <span className="text-xs font-bold">{level}</span>
            </div>

            <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/60 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
               <Activity size={18} className={isDark ? 'text-night-secondary' : 'text-day-primary'} /> 
               <span className="text-xs font-bold whitespace-nowrap">
                 WPM: {history.length > 0 ? history[history.length-1].wpm : '--'}
               </span>
            </div>

            {/* Message Icon & Popup Container */}
            <div className="relative" ref={messagePopupRef}>
              <button 
                onClick={toggleMessage}
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

              {/* The Pop-up Notification */}
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
                  
                  {/* Tip arrow pointing up */}
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

      {/* Main Content - Grid Layout */}
      <main className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Column: Content (75%) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Typing Area */}
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

            {/* Visual Keyboard */}
            <section className="w-full">
               <h3 className="font-bold text-sm opacity-75 mb-2 px-1">Panduan Visual</h3>
               <VirtualKeyboard 
                  activeKey={activeKey} 
                  criticalKeys={lesson?.criticalKeys || []} 
                  isDark={isDark}
               />
            </section>

          </div>

          {/* Right Column: Sidebar Stats (25%) */}
          <div className="lg:col-span-1 sticky top-24">
             {/* Study Timer */}
             <StudyTimer isDark={isDark} isRunning={isTimerRunning} />

             <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                <StatsDisplay history={history} isDark={isDark} />
             </div>
             
             {/* Mini Legend / Tips */}
             <div className={`mt-4 p-4 rounded-xl text-xs leading-relaxed opacity-75 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <p><strong>Tips:</strong> Fokus pada akurasi sebelum kecepatan. Grafik di atas menunjukkan WPM Anda dari setiap sesi.</p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;