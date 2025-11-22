import React, { useState, useEffect } from 'react';
import { Clock, Settings, Lock, CheckCircle, PauseCircle } from 'lucide-react';

interface StudyTimerProps {
  isDark: boolean;
  isRunning: boolean;
}

const StudyTimer: React.FC<StudyTimerProps> = ({ isDark, isRunning }) => {
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastConfigDate, setLastConfigDate] = useState<string | null>(null);

  // Get current date string YYYY-MM-DD for storage keys
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Load state from local storage
    const savedTarget = localStorage.getItem('study_timer_target');
    const savedElapsed = localStorage.getItem('study_timer_elapsed');
    const savedDate = localStorage.getItem('study_timer_date');
    const savedConfigDate = localStorage.getItem('study_timer_config_date');

    const today = getTodayDate();

    if (savedTarget) setTargetMinutes(parseInt(savedTarget));
    if (savedConfigDate) setLastConfigDate(savedConfigDate);

    // Reset timer if it's a new day
    if (savedDate === today) {
      if (savedElapsed) setElapsedSeconds(parseInt(savedElapsed));
    } else {
      setElapsedSeconds(0);
      localStorage.setItem('study_timer_date', today);
      localStorage.setItem('study_timer_elapsed', '0');
    }
  }, []);

  // Timer tick - Only runs if isRunning is true
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const newVal = prev + 1;
        localStorage.setItem('study_timer_elapsed', newVal.toString());
        localStorage.setItem('study_timer_date', getTodayDate());
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSetDuration = (minutes: number) => {
    const today = getTodayDate();
    
    // If already configured today, prevent change
    if (lastConfigDate === today) return;

    setTargetMinutes(minutes);
    setLastConfigDate(today);
    localStorage.setItem('study_timer_target', minutes.toString());
    localStorage.setItem('study_timer_config_date', today);
    setIsSettingsOpen(false);
  };

  const isConfigLocked = lastConfigDate === getTodayDate();

  // Formatting
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const progressPercent = Math.min((elapsedSeconds / (targetMinutes * 60)) * 100, 100);
  const remainingSeconds = Math.max((targetMinutes * 60) - elapsedSeconds, 0);
  const isComplete = remainingSeconds === 0;

  return (
    <div className={`p-4 rounded-2xl border mb-4 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 text-night-secondary' : 'bg-orange-50 text-day-primary'}`}>
            <Clock size={16} />
          </div>
          <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Target Harian</h3>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}
          title="Atur Durasi"
        >
          {isConfigLocked ? <Lock size={14} /> : <Settings size={14} />}
        </button>
      </div>

      {isSettingsOpen && (
        <div className={`mb-4 p-3 rounded-lg text-xs ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold opacity-75">Pilih Durasi:</span>
            {isConfigLocked && <span className="text-red-400 text-[10px]">Terkunci hari ini</span>}
          </div>
          <div className="flex gap-2">
            {[30, 45, 60].map(min => (
              <button
                key={min}
                onClick={() => handleSetDuration(min)}
                disabled={isConfigLocked}
                className={`flex-1 py-1.5 px-2 rounded border transition-all ${
                  targetMinutes === min 
                    ? (isDark ? 'bg-night-primary border-night-secondary text-white' : 'bg-day-primary border-day-secondary text-white')
                    : (isDark ? 'border-slate-600 hover:bg-slate-700 disabled:opacity-50' : 'border-gray-200 hover:bg-white disabled:opacity-50')
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] opacity-60">*Hanya bisa diubah 1x per hari</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {isComplete ? 'Target Tercapai!' : 'Sisa Waktu'}
            {!isRunning && !isComplete && elapsedSeconds > 0 && (
                <span className="text-[10px] opacity-70 ml-1 flex items-center">(<PauseCircle size={10} className="mr-0.5"/> Jeda)</span>
            )}
          </span>
          <span className={isComplete ? 'text-green-500' : (isDark ? 'text-white' : 'text-gray-800')}>
             {isComplete ? <CheckCircle size={14} className="inline" /> : formatTime(remainingSeconds)}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
          <div 
            className={`h-full transition-all duration-500 ease-out ${isComplete ? 'bg-green-500' : (isDark ? 'bg-night-primary' : 'bg-day-primary')} ${isRunning ? 'opacity-100' : 'opacity-50'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="text-[10px] text-right opacity-50">
           Total hari ini: {Math.floor(elapsedSeconds / 60)} menit
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;