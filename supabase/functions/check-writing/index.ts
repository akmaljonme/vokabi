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

    const systemPrompt = `You are an expert IELTS/CEFR Writing examiner. Evaluate the essay based on the ${level} level criteria.

Return your response as a JSON object with this exact structure:
{
  "overallBand": number (1-9 for IELTS style, or percentage 0-100),
  "criteria": {
    "taskAchievement": { "score": number, "feedback": "string" },
    "coherenceAndCohesion": { "score": number, "feedback": "string" },
    "lexicalResource": { "score": number, "feedback": "string" },
    "grammaticalRange": { "score": number, "feedback": "string" }
  },
  "overallFeedback": "string with general comments and suggestions for improvement",
  "correctedEssay": "string with the corrected version highlighting key fixes"
}

Be fair, constructive, and specific in feedback. Give scores out of 9. Write feedback in Uzbek language.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
