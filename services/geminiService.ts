import { GoogleGenAI, Type } from "@google/genai";
import { AppMode, DifficultyLevel, LessonData, TypingResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Anda adalah "Guru Ketik Adaptif Gemini," tutor mengetik 10 jari yang sabar, cerdas, dan personal.
Tugas Anda adalah menganalisis performa mengetik dan menghasilkan materi latihan berikutnya.

ATURAN LOGIKA & PEDAGOGI:
1. **LEVEL PEMULA (CRITICAL):**
   - **JANGAN** langsung memberikan kalimat atau kata-kata nyata (real words).
   - Mulai dengan **DRILL HURUF** murni. Contoh: "fjfj jfjf dkd kdkd" atau "asdf fdsa".
   - Pengenalan huruf harus bertahap. Jangan gabungkan semua home row sekaligus jika akurasi masih rendah.
   - Hanya perkenalkan kata nyata sederhana (contoh: "da da da", "fa fa fa") jika Error Rate < 2%.
   
2. **LEVEL MENENGAH:** 
   - Fokus Baris Angka & Shift/Enter/Koma/Titik.
   - Mulai gabungkan kata-kata nyata dengan tanda baca.

3. **LEVEL MAHIR:** 
   - Fokus Kecepatan & Akurasi (Semua tombol, kalimat kompleks). Target: WPM > 70, Error < 1%.

ATURAN RESPON:
1. Jika Mode SIANG: Nada cerah, semangat.
2. Jika Mode MALAM: Nada tenang, rileks.
3. Analisis Typo: Temukan 3 huruf yang paling sering salah dari input pengguna. Jadikan ini "criticalKeys".
4. Penentuan Level:
   - Jika kriteria level saat ini TERPENUHI: Naikkan level (atau tetap di Mahir). Berikan selamat.
   - Jika TIDAK terpenuhi: Jangan naikkan level. Berikan "Sesi Perbaikan Khusus" fokus pada criticalKeys menggunakan pola repetitif (bukan kalimat).
5. lessonText: Harus berupa string teks polos untuk diketik pengguna. Panjang sekitar 100-200 karakter. 

OUTPUT FORMAT:
Kembalikan JSON sesuai skema.
`;

export const generateInitialLesson = async (): Promise<LessonData> => {
  // Hardcoded initial lesson to save tokens and ensure immediate start
  return {
    tutorMessage: "Halo! Saya Guru Ketik Adaptif Gemini. Kita tidak akan buru-buru. Kita mulai dengan pengenalan pola dasar jari telunjuk. Rasakan letak tombol F dan J.",
    lessonText: "ffff jjjj ffff jjjj fjfj jfjf ff jj fj jf fff jjj fjf jfj f j f j",
    criticalKeys: ["f", "j"],
    nextLevel: DifficultyLevel.PEMULA
  };
};

export const generateAdaptiveLesson = async (
  currentLevel: DifficultyLevel,
  mode: AppMode,
  lastResult: TypingResult,
  targetText: string
): Promise<LessonData> => {
  
  const prompt = JSON.stringify({
    CURRENT_LEVEL: currentLevel,
    MODE: mode,
    WPM_RESULT: lastResult.wpm,
    ERROR_RATE_RESULT: lastResult.errorRate,
    ACTUAL_TYPED_TEXT: lastResult.actualTypedText,
    TARGET_TEXT_WAS: targetText
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this user session and generate the next lesson:\n${prompt}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tutorMessage: { type: Type.STRING },
            lessonText: { type: Type.STRING },
            criticalKeys: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            nextLevel: { 
              type: Type.STRING, 
              enum: [DifficultyLevel.PEMULA, DifficultyLevel.MENENGAH, DifficultyLevel.MAHIR] 
            }
          },
          required: ["tutorMessage", "lessonText", "criticalKeys", "nextLevel"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as LessonData;
    } else {
      throw new Error("No text returned from Gemini");
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback in case of API error
    return {
      tutorMessage: "Maaf, saya mengalami gangguan koneksi sebentar. Mari kita ulang latihan pola sebelumnya.",
      lessonText: targetText, // Repeat last text
      criticalKeys: [],
      nextLevel: currentLevel
    };
  }
};