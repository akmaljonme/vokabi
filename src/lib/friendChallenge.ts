import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

export interface ChallengeQuestion {
  question: string;
  options: string[];
  correct: number; // index into options
}

export const CHALLENGE_SKILLS: { key: string; label: string; emoji: string }[] = [
  { key: "vocabulary", label: "Lug'at", emoji: "📚" },
  { key: "grammar", label: "Grammatika", emoji: "✍️" },
  { key: "reading", label: "Reading", emoji: "📖" },
  { key: "listening", label: "Listening tushunchalari", emoji: "🎧" },
];

export const CHALLENGE_QUESTION_COUNT = 8;
export const CHALLENGE_WINNER_XP = 50;
export const CHALLENGE_PARTICIPANT_XP = 15;

/** Generates a small head-to-head MCQ quiz via the existing ai-tutor edge function. */
export const generateChallengeQuestions = async (
  skill: string,
): Promise<ChallengeQuestion[]> => {
  const skillLabel = CHALLENGE_SKILLS.find((s) => s.key === skill)?.label || skill;
  try {
    const { data, error } = await supabase.functions.invoke("ai-tutor", {
      body: {
        messages: [
          {
            role: "user",
            content: `Ingliz tili "${skillLabel}" mavzusida ${CHALLENGE_QUESTION_COUNT} ta B1-B2 darajasidagi qiziqarli test savoli tuzing (har biri 4 variantli, faqat bitta to'g'ri javob bilan). FAQAT quyidagi JSON massiv formatida javob bering, boshqa hech narsa yozmang:\n[{"question": "...", "options": ["...","...","...","..."], "correct": 0}]`,
          },
        ],
      },
    });
    if (error) throw error;
    const text = data?.response || data?.content?.[0]?.text || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const questions = (Array.isArray(parsed) ? parsed : [])
      .filter(
        (q: any) =>
          q?.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correct === "number",
      )
      .slice(0, CHALLENGE_QUESTION_COUNT);
    if (questions.length === 0) throw new Error("empty");
    return questions;
  } catch {
    return [];
  }
};

export const isChallengeExpired = (expiresAt: string) =>
  new Date(expiresAt).getTime() < Date.now();
