import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TypingResult } from '../types';
import { RefreshCw } from 'lucide-react';

interface TypingCanvasProps {
  targetText: string;
  onComplete: (result: TypingResult) => void;
  onCharTyped: (char: string) => void; // For keyboard visual
  onTypingStart: () => void;
  isDark: boolean;
}

const TypingCanvas: React.FC<TypingCanvasProps> = ({ targetText, onComplete, onCharTyped, onTypingStart, isDark }) => {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus helper
  useEffect(() => {
    if (!isFinished) {
        inputRef.current?.focus();
    }
  }, [targetText, isFinished]);

  // Reset when lesson changes
  useEffect(() => {
    setInput('');
    setStartTime(null);
    setIsFinished(false);
  }, [targetText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;

    const val = e.target.value;
    
    // Start timer on first char
    if (!startTime && val.length === 1) {
      setStartTime(Date.now());
      onTypingStart(); // Notify App that typing started
    }

    // Update keyboard visual
    const lastChar = val.slice(-1);
    if (lastChar) onCharTyped(lastChar);

    // Prevent backspacing beyond start (simplified for tutorial)
    if (val.length < input.length) {
       // Allow backspace
    }

    setInput(val);

    // Check completion
    if (val.length >= targetText.length) {
      finishSession(val);
    }
  };

  const finishSession = (finalInput: string) => {
    setIsFinished(true);
    const endTime = Date.now();
    const durationMinutes = ((endTime - (startTime || endTime)) / 1000) / 60;
    
    // Calculate WPM (standard: 5 chars = 1 word)
    const words = finalInput.length / 5;
    const wpm = Math.round(durationMinutes > 0 ? words / durationMinutes : 0);

    // Calculate Errors
    let errors = 0;
    for (let i = 0; i < targetText.length; i++) {
      if (finalInput[i] !== targetText[i]) errors++;
    }
    const errorRate = (errors / targetText.length) * 100;
    const accuracy = 100 - errorRate;

    onComplete({
      wpm,
      errorRate: parseFloat(errorRate.toFixed(2)),
      accuracy: parseFloat(accuracy.toFixed(2)),
      actualTypedText: finalInput,
      timestamp: Date.now()
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInput('');
    setStartTime(null);
    inputRef.current?.focus();
    // Note: We don't stop the timer explicitly here as we want to encourage restarting quickly, 
    // but strictly the "session" hasn't started until they type again. 
    // However, since App controls the timer via TypingStart, we leave it running or handle it in App if needed.
    // For this specific request, we just reset the canvas state.
  };

  const renderTextOverlay = () => {
    return targetText.split('').map((char, index) => {
      const typedChar = input[index];
      // Reduced font size from text-2xl/3xl to text-xl/2xl for compactness
      let className = "font-mono text-xl md:text-2xl transition-colors duration-75 ";
      
      if (typedChar === undefined) {
        // Not typed yet
        className += isDark ? "text-slate-600" : "text-gray-300";
        if (index === input.length) className += isDark ? " bg-slate-700/50 animate-pulse" : " bg-gray-200 animate-pulse"; // Cursor
      } else if (typedChar === char) {
        // Correct
        className += isDark ? "text-day-bg" : "text-gray-800";
      } else {
        // Incorrect
        className += "text-red-500 bg-red-500/20 rounded";
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div 
      // Reduced min-height and padding
      className="relative w-full min-h-[120px] flex flex-wrap content-start p-4 rounded-xl cursor-text border-2 transition-colors"
      onClick={() => inputRef.current?.focus()}
      style={{
        borderColor: isDark ? (inputRef.current === document.activeElement ? '#818cf8' : '#334155') : (inputRef.current === document.activeElement ? '#ea580c' : '#e5e7eb'),
        backgroundColor: isDark ? '#1e293b' : '#ffffff'
      }}
    >
      {/* Hidden Input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputChange}
        className="absolute opacity-0 w-0 h-0"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* Visual Overlay */}
      <div className="w-full break-words whitespace-pre-wrap leading-relaxed">
        {renderTextOverlay()}
      </div>

      {/* Reset hint */}
      <div className="absolute bottom-2 right-2">
         <button 
            onClick={handleReset}
            className={`p-1.5 rounded-full hover:bg-opacity-20 transition-all ${isDark ? 'hover:bg-white text-slate-500' : 'hover:bg-black text-gray-400'}`}
         >
            <RefreshCw size={14} />
         </button>
      </div>
    </div>
  );
};

export default TypingCanvas;