import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, question, level } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
      if (response.status === 402) return new Response(JSON.stringify({ error: "Kredit yetarli emas" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
