import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const clampBand = (value: number) => Math.max(1, Math.min(9, Math.round(value * 2) / 2));

const buildFallbackWritingEvaluation = (essay: string, question: string, level: string) => {
  const cleaned = (essay || "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const paragraphs = cleaned.split(/\n\s*\n/).filter((part) => part.trim().length > 0);
  const sentenceCount = cleaned.split(/[.!?]+/).filter((part) => part.trim().length > 0).length || 1;
  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^a-z']/gi, "")).filter(Boolean);
  const uniqueWordCount = new Set(normalizedWords).size;
  const lexicalVariety = uniqueWordCount / Math.max(wordCount, 1);
  const hasLinkers = /\b(firstly|first|secondly|second|however|moreover|therefore|for example|in conclusion|because|although|while)\b/i.test(cleaned);
  const hasComplexStructures = /\b(although|while|whereas|if|which|that|because|would|could|should)\b/i.test(cleaned);
  const lowerQuestion = (question || "").toLowerCase();
  const questionKeywords = lowerQuestion.match(/[a-z]{4,}/g) || [];
  const keywordHits = questionKeywords.filter((keyword) => cleaned.toLowerCase().includes(keyword)).length;
  const taskPenalty = wordCount < 120 ? 2 : wordCount < 180 ? 1 : 0;
  const repetitionPenalty = lexicalVariety < 0.42 ? 0.5 : 0;
  const structurePenalty = paragraphs.length < 2 ? 1 : 0;
  const topicPenalty = questionKeywords.length > 0 && keywordHits === 0 ? 1.5 : 0;

  const taskAchievement = clampBand(5 + (keywordHits >= 2 ? 0.5 : 0) - taskPenalty - topicPenalty);
  const coherenceAndCohesion = clampBand(5 + (paragraphs.length >= 2 ? 0.5 : 0) + (hasLinkers ? 0.5 : 0) - structurePenalty - taskPenalty);
  const lexicalResource = clampBand(4.5 + (lexicalVariety >= 0.58 ? 1 : lexicalVariety >= 0.48 ? 0.5 : 0) - repetitionPenalty - taskPenalty);
  const grammaticalRange = clampBand(4.5 + (hasComplexStructures ? 0.5 : 0) + (sentenceCount >= 4 ? 0.5 : 0) - taskPenalty);
  const overallBand = clampBand((taskAchievement + coherenceAndCohesion + lexicalResource + grammaticalRange) / 4);

  return {
    overallBand,
    criteria: {
      taskAchievement: {
        score: taskAchievement,
        feedback: `AI limiti tugagani uchun vaqtincha soddalashtirilgan baholash ishlatildi. Essay ${wordCount} ta so'zdan iborat. ${topicPenalty > 0 ? "Savol mazmuniga to'g'ridan-to'g'ri javob berish kuchsiz ko'rinadi." : "Mavzuga aloqador javob bor, lekin g'oyalarni chuqurroq rivojlantirish kerak."}`,
      },
      coherenceAndCohesion: {
        score: coherenceAndCohesion,
        feedback: paragraphs.length >= 2
          ? "Paragraf ajratish mavjud, bu yaxshi. Endi fikrlar orasidagi bog'lanishni yanada tabiiy qilish kerak."
          : "Paragraflar tuzilmasi yetarli emas. Kirish, asosiy qism va xulosa ko'rinishida aniq bo'ling.",
      },
      lexicalResource: {
        score: lexicalResource,
        feedback: lexicalVariety >= 0.48
          ? "Lug'at zaxirasi yomon emas, lekin aniqroq va akademikroq so'zlar bilan kuchaytirish mumkin."
          : "So'zlar takrori ko'p. Sinonimlar va mavzuga mos collocationlarni ko'proq ishlating.",
      },
      grammaticalRange: {
        score: grammaticalRange,
        feedback: hasComplexStructures
          ? "Murakkab gaplar ishlatishga urinish bor. Endi grammatik aniqlik va tinish belgilari ustida ishlash kerak."
          : "Asosan sodda gaplar ishlatilgan. Complex sentence va clause'larni ko'proq qo'llang.",
      },
    },
    overallFeedback: `Hozircha AI krediti tugagani sababli soddalashtirilgan writing baholash ko'rsatildi. ${level} darajasi uchun essayni kamida 3 paragrafga bo'ling, har paragrafda bitta asosiy fikrni misol bilan oching va so'z takrorini kamaytiring.`,
    correctedEssay: cleaned || "Please rewrite your essay with a clear introduction, one or two body paragraphs, and a short conclusion.",
    fallback: true,
    notice: question ? `Savol: ${question}` : "",
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, { headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" } });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { essay, question, level } = await req.json();
    if (typeof essay === "string" && essay.length > 8000) {
      return new Response(JSON.stringify({ error: "Essay too long (max 8000 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const essayWordCount = (essay || "").trim().split(/\s+/).filter(Boolean).length;
    if (!essay || essayWordCount < 5) {
      return new Response(JSON.stringify({ error: "Iltimos, javobingizni yozing (kamida 5 ta so'z)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof question === "string" && question.length > 2000) {
      return new Response(JSON.stringify({ error: "Question too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are a certified IELTS Writing examiner with 15+ years of experience. Evaluate the essay STRICTLY using official IELTS Writing Band Descriptors at ${level} level.

CRITICAL SCORING RULES — follow exactly:
- Score each criterion from 1.0 to 9.0 in 0.5 increments (e.g. 5.5, 6.0, 6.5).
- overallBand = average of 4 criteria, rounded to nearest 0.5.
- Word count matters: Task 2 < 250 words → max band 5. Task 1 < 150 words → max band 5.
- Off-topic essay → max band 4 in Task Achievement.
- Memorized/copied text → max band 4 in Lexical Resource.
- Many basic grammar errors (subject-verb, articles, tense) → max band 5 in Grammatical Range.
- No paragraphs / no clear structure → max band 4 in Coherence.
- Be HONEST and STRICT — do NOT inflate scores. A weak A2/B1 essay is band 4-5, not 7.
- Be ENCOURAGING in tone but ACCURATE in numbers.

CRITERIA (each scored 0-9):
1. Task Achievement — Does it answer the question fully? Position clear? Ideas developed with examples?
2. Coherence & Cohesion — Logical flow? Paragraphing? Linking words used naturally (not overused)?
3. Lexical Resource — Vocabulary range, accuracy, collocations, awareness of style. Penalize repetition and misused words.
4. Grammatical Range & Accuracy — Variety of structures (complex sentences, conditionals, passives), accuracy of grammar/punctuation. Count errors.

FEEDBACK REQUIREMENTS:
- Write all feedback in O'zbek tili (Uzbek). Quote specific phrases from the student's essay in English when pointing out errors.
- For each criterion, give: (a) specific examples from the essay, (b) what was good, (c) what to improve.
- correctedEssay: rewrite the essay properly in English, fixing grammar, vocabulary, and structure while keeping the student's main ideas.
- overallFeedback: 3-5 concrete actionable tips in Uzbek.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Question: ${question}\n\nEssay:\n${essay}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate_writing",
            description: "Return structured writing evaluation",
            parameters: {
              type: "object",
              properties: {
                overallBand: { type: "number" },
                criteria: {
                  type: "object",
                  properties: {
                    taskAchievement: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                    coherenceAndCohesion: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                    lexicalResource: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                    grammaticalRange: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                  },
                  required: ["taskAchievement", "coherenceAndCohesion", "lexicalResource", "grammaticalRange"]
                },
                overallFeedback: { type: "string" },
                correctedEssay: { type: "string" },
              },
              required: ["overallBand", "criteria", "overallFeedback", "correctedEssay"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "evaluate_writing" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Keyinroq urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI krediti tugagan. Workspace -> Usage bo'limidan kredit qo'shing." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-writing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
