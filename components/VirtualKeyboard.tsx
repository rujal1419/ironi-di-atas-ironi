import React from 'react';
import { Language } from '../types';

interface VirtualKeyboardProps {
  activeKey: string | null;
  criticalKeys: string[];
  keyMastery?: Record<string, number>;
  isDark: boolean;
  language: Language;
}

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Space']
];

const KEY_MAPS: Partial<Record<Language, Record<string, string>>> = {
  [Language.ARAB]: {
    'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'د',
    'a': 'ش', 's': 'س', 'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ك', "'": 'ط',
    'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا', 'n': 'ى', 'm': 'ة', ',': 'و', '.': 'ز', '/': 'ظ',
    '`': 'ذ'
  },
  [Language.JEPANG]: {
    '1': 'ぬ', '2': 'ふ', '3': 'あ', '4': 'う', '5': 'え', '6': 'お', '7': 'や', '8': 'ゆ', '9': 'よ', '0': 'わ', '-': 'ほ', '=': 'へ',
    'q': 'た', 'w': 'て', 'e': 'い', 'r': 'す', 't': 'か', 'y': 'ん', 'u': 'な', 'i': 'に', 'o': 'ら', 'p': 'せ', '[': '゛', ']': '゜', '\\': 'む',
    'a': 'ち', 's': 'と', 'd': 'し', 'f': 'は', 'g': 'き', 'h': 'く', 'j': 'ま', 'k': 'の', 'l': 'り', ';': 'れ', "'": 'け',
    'z': 'つ', 'x': 'さ', 'c': 'そ', 'v': 'ひ', 'b': 'こ', 'n': 'み', 'm': 'も', ',': 'ね', '.': 'る', '/': 'め'
  }
};

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ activeKey, criticalKeys, keyMastery = {}, isDark, language }) => {
  
  const getDisplayKey = (key: string) => {
    if (key.length > 1) return key;
    const lowerKey = key.toLowerCase();
    const map = KEY_MAPS[language];
    if (map && map[lowerKey]) {
      return map[lowerKey];
    }
    return key;
  };

  const getKeyStyle = (key: string) => {
    const lowerKey = key.toLowerCase();
    const displayChar = getDisplayKey(key);
    
    const lowerActive = activeKey?.toLowerCase();
    
    // Highlight if matches physical key OR mapped char (allows typing in native or latin mode for highlighting)
    const isActive = lowerKey === lowerActive || displayChar === lowerActive;
    
    const masteryScore = keyMastery[lowerKey] || 0;
    
    // Critical if matches physical key OR mapped char
    const isCritical = criticalKeys.includes(lowerKey) || criticalKeys.includes(displayChar);

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
    
    const isSpecial = ['Space', 'Backspace', 'Tab', 'CapsLock', 'Enter', 'Shift'].includes(key);

    // Theme & Mastery Colors
    if (isDark) {
      if (isActive) return baseClass + "bg-night-primary text-white border-night-secondary ring-2 ring-night-secondary transform scale-95 z-10";
      
      if (!isSpecial && masteryScore > 0) {
        if (masteryScore < 25) return baseClass + "bg-red-900/40 text-red-200 border-red-900";
        if (masteryScore < 50) return baseClass + "bg-orange-900/40 text-orange-200 border-orange-900";
        if (masteryScore < 75) return baseClass + "bg-yellow-900/30 text-yellow-200 border-yellow-900";
        return baseClass + "bg-green-900/30 text-green-200 border-green-900";
      }
      
      if (isCritical) return baseClass + "bg-red-900/50 text-red-200 border-red-800 animate-pulse";
      return baseClass + "bg-slate-800 text-slate-400 border-slate-700";
    } else {
      if (isActive) return baseClass + "bg-day-primary text-white border-day-secondary ring-2 ring-day-secondary transform scale-95 z-10";
      
      if (!isSpecial && masteryScore > 0) {
        if (masteryScore < 25) return baseClass + "bg-red-50 text-red-600 border-red-200";
        if (masteryScore < 50) return baseClass + "bg-orange-50 text-orange-600 border-orange-200";
        if (masteryScore < 75) return baseClass + "bg-yellow-50 text-yellow-600 border-yellow-200";
        return baseClass + "bg-green-50 text-green-600 border-green-200";
      }

      if (isCritical) return baseClass + "bg-red-100 text-red-600 border-red-300 animate-pulse";
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
                {key === 'Space' ? '' : getDisplayKey(key)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={`text-center mt-2 text-[10px] sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        *Tombol berkedip merah: Fokus Perbaikan. Warna latar: Tingkat Penguasaan.
      </div>
    </div>
  );
};

export default VirtualKeyboard;