import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const clampBand = (value: number) => Math.max(1, Math.min(9, Math.round(value * 2) / 2));

const buildFallbackSpeakingEvaluation = (transcript: string, question: string, level: string) => {
  const cleaned = (transcript || "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^a-z']/gi, "")).filter(Boolean);
  const uniqueWordCount = new Set(normalizedWords).size;
  const sentenceCount = cleaned.split(/[.!?]+/).filter((part) => part.trim().length > 0).length || 1;
  const lexicalVariety = uniqueWordCount / Math.max(wordCount, 1);
  const hasConnectors = /\b(because|however|also|first|firstly|second|for example|in addition|but|so|then|after|finally)\b/i.test(cleaned);
  const hasComplexForms = /\b(although|while|when|which|who|that|if|would|could|should)\b/i.test(cleaned);
  const shortPenalty = wordCount < 20 ? 2 : wordCount < 45 ? 1 : 0;
  const repetitionPenalty = lexicalVariety < 0.42 ? 0.5 : 0;

  const fluencyAndCoherence = clampBand(4.5 + (wordCount >= 70 ? 1 : wordCount >= 40 ? 0.5 : 0) + (hasConnectors ? 0.5 : 0) - shortPenalty - repetitionPenalty);
  const lexicalResource = clampBand(4.5 + (lexicalVariety >= 0.62 ? 1 : lexicalVariety >= 0.5 ? 0.5 : 0) - shortPenalty - repetitionPenalty);
  const grammaticalRange = clampBand(4.5 + (hasComplexForms ? 0.5 : 0) + (sentenceCount >= 3 ? 0.5 : 0) - shortPenalty);
  const pronunciation = clampBand(Math.min(fluencyAndCoherence, lexicalResource, grammaticalRange) - 0.5);
  const overallBand = clampBand((fluencyAndCoherence + lexicalResource + grammaticalRange + pronunciation) / 4);

  return {
    overallBand,
    criteria: {
      fluencyAndCoherence: {
        score: fluencyAndCoherence,
        feedback: `AI limiti tugagani uchun vaqtincha avtomatik fallback baholash ishlatildi. Javobingizda ${wordCount} ta so'z bor. ${hasConnectors ? "Bog'lovchilar ishlatilgan, bu fikr oqimini yaxshilaydi." : "Bog'lovchilar kam, fikrlar orasini 'because', 'also', 'for example' kabi vositalar bilan ulang."}`,
      },
      lexicalResource: {
        score: lexicalResource,
        feedback: lexicalVariety >= 0.5
          ? "Lug'at xilma-xilligi yomon emas, lekin aniqroq va tabiiyroq iboralar bilan javobni boyitish mumkin."
          : "Bir xil so'zlar ko'p takrorlangan. Sinonimlar va mavzuga mos iboralarni ko'proq ishlating.",
      },
      grammaticalRange: {
        score: grammaticalRange,
        feedback: hasComplexForms
          ? "Murakkabroq strukturalar bor, lekin aniqlikni oshirish kerak. Gaplarni qisqa va grammatik jihatdan toza tuzing."
          : "Asosan sodda gaplar ishlatilgan. 'when', 'because', 'if' bilan murakkabroq gaplar tuzishga harakat qiling.",
      },
      pronunciation: {
        score: pronunciation,
        feedback: "Audio tinglanmagani uchun talaffuz taxminiy baholandi. So'z urg'usi, endinglar va ravonlik ustida alohida mashq qiling.",
      },
    },
    overallFeedback: `Hozircha AI krediti tugagani sababli soddalashtirilgan baholash ko'rsatildi. ${level} darajasi uchun javobni savolga to'g'ridan-to'g'ri bog'lang, 3-4 ta aniq detail qo'shing va kamida 5-6 ta to'liq gap bilan yakunlang.`,
    suggestedResponse: `I would answer the question clearly and directly. First, I would give a short main idea, and then I would add two or three specific details or examples. After that, I would explain why it is important to me and finish with a simple conclusion. This makes the answer more natural, better organized, and easier to follow in a speaking exam.`,
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
    const { transcript, question, level } = await req.json();
    if (typeof transcript === "string" && transcript.length > 8000) {
      return new Response(JSON.stringify({ error: "Transcript too long (max 8000 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const transcriptWordCount = (transcript || "").trim().split(/\s+/).filter(Boolean).length;
    if (!transcript || transcriptWordCount < 3) {
      return new Response(JSON.stringify({ error: "Iltimos, biror narsa gapiring (kamida 3 ta so'z)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof question === "string" && question.length > 2000) {
      return new Response(JSON.stringify({ error: "Question too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const wordCount = (transcript || "").trim().split(/\s+/).filter(Boolean).length;

    const systemPrompt = `You are a certified IELTS Speaking examiner with 15+ years of experience. Evaluate the student's spoken response (transcript) STRICTLY using official IELTS Speaking Band Descriptors at ${level} level.

CONTEXT:
- Transcript word count: ${wordCount}
- Transcript comes from speech-to-text, so minor transcription errors are possible — focus on language quality, not transcription glitches.

CRITICAL SCORING RULES — follow exactly:
- Score each criterion from 1.0 to 9.0 in 0.5 increments.
- overallBand = average of 4 criteria, rounded to nearest 0.5.
- Very short answer (< 20 words) → max band 4 (insufficient response).
- Off-topic answer → max band 4 in Fluency & Coherence.
- Many basic grammar errors → max band 5 in Grammatical Range.
- Repetitive simple vocabulary only → max band 5 in Lexical Resource.
- Be HONEST and STRICT — do NOT inflate scores. Weak A2/B1 response = band 4-5, not 7.

CRITERIA (each 0-9):
1. Fluency & Coherence — Speed, hesitation patterns (visible as repetitions in transcript), logical flow, use of discourse markers.
2. Lexical Resource — Vocabulary range, idiomatic language, paraphrasing ability, accuracy.
3. Grammatical Range & Accuracy — Variety of tenses and structures, accuracy. Count errors.
4. Pronunciation — Inferred from transcript: word choice, common L1-Uzbek pronunciation patterns. Be modest with this score since you can't hear audio.

FEEDBACK REQUIREMENTS:
- Write all feedback in O'zbek tili (Uzbek). Quote the student's actual phrases in English when pointing out issues.
- For each criterion: specific examples + what was good + what to improve.
- suggestedResponse: a high-quality model answer (band 7-8) in English, ~80-120 words.
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
          { role: "user", content: `Question: ${question}\n\nStudent's response (transcript):\n${transcript}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate_speaking",
            description: "Return structured speaking evaluation",
            parameters: {
              type: "object",
              properties: {
                overallBand: { type: "number" },
                criteria: {
                  type: "object",
                  properties: {
                    fluencyAndCoherence: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                    lexicalResource: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                    grammaticalRange: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                    pronunciation: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
                  },
                  required: ["fluencyAndCoherence", "lexicalResource", "grammaticalRange", "pronunciation"]
                },
                overallFeedback: { type: "string" },
                suggestedResponse: { type: "string" },
              },
              required: ["overallBand", "criteria", "overallFeedback", "suggestedResponse"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "evaluate_speaking" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI krediti tugagan. Workspace -> Usage bo'limidan kredit qo'shing." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-speaking error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
