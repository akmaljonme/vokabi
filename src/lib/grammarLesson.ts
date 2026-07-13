import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

export interface GrammarQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface GrammarLesson {
  explanation: string;
  examples: string[];
  questions: GrammarQuestion[];
}

export const QUESTION_COUNT = 5;

export const generateGrammarLesson = async (
  topicTitle: string,
  level: string,
): Promise<GrammarLesson | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("ai-tutor", {
      body: {
        messages: [
          {
            role: "user",
            content: `Ingliz tili grammatikasidan "${topicTitle}" mavzusi bo'yicha (CEFR darajasi: ${level}) o'quv darsi tuzing. Quyidagilar bo'lsin:
1. "explanation" — mavzuni o'zbek tilida 3-5 jumlada tushuntirish (grammatik qoida)
2. "examples" — 4 ta ingliz tilidagi misol jumla (har birida qoida ishlatilgan)
3. "questions" — ${QUESTION_COUNT} ta 4 variantli test savoli (mavzuni mustahkamlash uchun), har birida faqat bitta to'g'ri javob

FAQAT quyidagi JSON formatda javob bering, boshqa hech narsa yozmang:
{"explanation": "...", "examples": ["...", "...", "...", "..."], "questions": [{"question": "...", "options": ["...","...","...","..."], "correct": 0}]}`,
          },
        ],
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    const text = data?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.explanation || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("empty");
    }
    return {
      explanation: parsed.explanation,
      examples: Array.isArray(parsed.examples) ? parsed.examples : [],
      questions: parsed.questions.slice(0, QUESTION_COUNT).filter(
        (q: any) => q?.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correct === "number",
      ),
    };
  } catch {
    return null;
  }
};
