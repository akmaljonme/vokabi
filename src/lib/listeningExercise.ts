import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

export interface ListeningQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface ListeningExercise {
  transcript: string;
  audioUrl: string;
  questions: ListeningQuestion[];
}

export const LISTENING_CATEGORIES = [
  { key: "conversation", label: "Kundalik suhbat", emoji: "💬" },
  { key: "phone_call", label: "Telefon qo'ng'irog'i", emoji: "📞" },
  { key: "news", label: "Yangiliklar", emoji: "📰" },
  { key: "lecture", label: "Ma'ruza", emoji: "🎓" },
  { key: "interview", label: "Intervyu", emoji: "🎙️" },
  { key: "announcement", label: "E'lon", emoji: "📢" },
];

export const LISTENING_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const QUESTION_COUNT = 5;

export const generateListeningExercise = async (
  level: string,
  category: string,
): Promise<ListeningExercise | null> => {
  try {
    const categoryLabel = LISTENING_CATEGORIES.find((c) => c.key === category)?.label || category;

    const { data: textData, error: textError } = await supabase.functions.invoke("ai-tutor", {
      body: {
        messages: [
          {
            role: "user",
            content: `Ingliz tilida "${categoryLabel}" mavzusida, CEFR ${level} darajasiga mos, tabiiy eshitiladigan 120-180 so'zli matn (dialog yoki monolog) yozing. Keyin shu matn bo'yicha tushunishni tekshiruvchi ${QUESTION_COUNT} ta 4 variantli test savoli tuzing (o'zbek tilida savol va variantlar bilan). FAQAT quyidagi JSON formatda javob bering:
{"transcript": "...", "questions": [{"question": "...", "options": ["...","...","...","..."], "correct": 0}]}`,
          },
        ],
      },
    });
    if (textError) throw textError;
    if (textData?.error) throw new Error(textData.error);
    const clean = (textData?.text || "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.transcript || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("empty");
    }

    // Audio generatsiya qilish (voice_assistant kvotasi ostida — bepul foydalanuvchilar uchun ham ishlaydi)
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const ttsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
    const res = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text: parsed.transcript, mode: "voice_assistant" }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || `TTS ${res.status}`);
    }
    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);

    return {
      transcript: parsed.transcript,
      audioUrl,
      questions: parsed.questions.slice(0, QUESTION_COUNT).filter(
        (q: any) => q?.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correct === "number",
      ),
    };
  } catch (err) {
    console.error("generateListeningExercise error:", err);
    return null;
  }
};
