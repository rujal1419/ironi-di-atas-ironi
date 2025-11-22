import React from 'react';

interface VirtualKeyboardProps {
  activeKey: string | null;
  criticalKeys: string[];
  keyMastery?: Record<string, number>;
  isDark: boolean;
}

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Space']
];

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ activeKey, criticalKeys, keyMastery = {}, isDark }) => {
  const getKeyStyle = (key: string) => {
    const lowerKey = key.toLowerCase();
    const lowerActive = activeKey?.toLowerCase();
    const masteryScore = keyMastery[lowerKey] || 0;
    
    // Dynamic sizing classes
    let widthClass = "w-7 sm:w-9 md:w-11"; 
    let heightClass = "h-8 sm:h-9 md:h-11"; 
    let fontSizeClass = "text-[10px] sm:text-xs md:text-sm";
    
    if (key === 'Space') {
      widthClass = "w-40 sm:w-56 md:w-72";
    } else if (['Backspace', 'Tab', 'CapsLock', 'Enter', 'Shift'].includes(key)) {
      widthClass = "w-12 sm:w-16 md:w-24 px-1";
    }

    let baseClass = `m-0.5 flex items-center justify-center rounded border shadow-sm transition-all duration-200 font-medium ${widthClass} ${heightClass} ${fontSizeClass} `;
    
    // Check if key is strictly special (no mastery tracking usually)
    const isSpecial = ['Space', 'Backspace', 'Tab', 'CapsLock', 'Enter', 'Shift'].includes(key);

    // Theme & Mastery Colors
    if (isDark) {
      if (lowerKey === lowerActive) return baseClass + "bg-night-primary text-white border-night-secondary ring-2 ring-night-secondary transform scale-95 z-10";
      
      if (!isSpecial && masteryScore > 0) {
        // Mastery Gradient for Dark Mode
        if (masteryScore < 25) return baseClass + "bg-red-900/40 text-red-200 border-red-900";
        if (masteryScore < 50) return baseClass + "bg-orange-900/40 text-orange-200 border-orange-900";
        if (masteryScore < 75) return baseClass + "bg-yellow-900/30 text-yellow-200 border-yellow-900";
        return baseClass + "bg-green-900/30 text-green-200 border-green-900";
      }
      
      if (criticalKeys.includes(lowerKey)) return baseClass + "bg-red-900/50 text-red-200 border-red-800 animate-pulse";
      return baseClass + "bg-slate-800 text-slate-400 border-slate-700";
    } else {
      if (lowerKey === lowerActive) return baseClass + "bg-day-primary text-white border-day-secondary ring-2 ring-day-secondary transform scale-95 z-10";
      
      if (!isSpecial && masteryScore > 0) {
        // Mastery Gradient for Light Mode
        if (masteryScore < 25) return baseClass + "bg-red-50 text-red-600 border-red-200";
        if (masteryScore < 50) return baseClass + "bg-orange-50 text-orange-600 border-orange-200";
        if (masteryScore < 75) return baseClass + "bg-yellow-50 text-yellow-600 border-yellow-200";
        return baseClass + "bg-green-50 text-green-600 border-green-200";
      }

      if (criticalKeys.includes(lowerKey)) return baseClass + "bg-red-100 text-red-600 border-red-300 animate-pulse";
      return baseClass + "bg-white text-gray-600 border-gray-200";
    }
  };

  return (
    <div className={`p-2 md:p-4 rounded-xl select-none flex flex-col items-center justify-center ${isDark ? 'bg-slate-900/50' : 'bg-gray-100'}`}>
      <div className="flex flex-col items-center">
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center w-full">
            {row.map((key, keyIndex) => (
              <div key={`${rowIndex}-${keyIndex}`} className={getKeyStyle(key)}>
                {key === 'Space' ? '' : key}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={`text-center mt-2 text-[10px] sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        *Tombol berkedip merah: Fokus Perbaikan. Warna latar: Tingkat Penguasaan (Merah &rarr; Hijau).
      </div>
    </div>
  );
};

export default VirtualKeyboard;