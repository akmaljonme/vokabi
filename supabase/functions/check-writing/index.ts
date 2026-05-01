import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { essay, question, level } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
      if (response.status === 402) return new Response(JSON.stringify({ error: "Kredit yetarli emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
