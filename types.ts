export enum DifficultyLevel {
  PEMULA = 'PEMULA',
  MENENGAH = 'MENENGAH',
  MAHIR = 'MAHIR'
}

export enum AppMode {
  SIANG = 'SIANG',
  MALAM = 'MALAM'
}

export enum Language {
  INDONESIA = 'Indonesia',
  INGGRIS = 'Inggris',
  ARAB = 'Arab',
  JEPANG = 'Jepang'
}

export interface TypingResult {
  wpm: number;
  errorRate: number;
  actualTypedText: string;
  accuracy: number;
  timestamp: number;
}

export interface LessonData {
  tutorMessage: string; // The persona response
  lessonText: string;   // The text to type
  criticalKeys: string[]; // Keys to highlight visually
  nextLevel: DifficultyLevel;
}

export interface KeyState {
  key: string;
  status: 'default' | 'active' | 'correct' | 'incorrect';
}