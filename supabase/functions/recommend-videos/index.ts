import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wrongQuestions, level, skill } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a helpful English learning assistant. Based on the student's wrong answers, suggest relevant YouTube video lessons that would help them improve.

Analyze the wrong questions and identify the weak topics/areas. Then suggest 3-5 real, popular YouTube videos or channels for learning those specific topics at the ${level} level for ${skill} skill.

Return your response using the suggest_videos tool.

IMPORTANT: Suggest REAL popular YouTube channels and video types. Use realistic YouTube URLs based on well-known English learning channels like:
- English with Lucy
- BBC Learning English  
- EngVid (engvid.com)
- Rachel's English
- Oxford Online English
- IELTS Liz
- E2 IELTS

Write descriptions in Uzbek language.`;

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
          { role: "user", content: `Wrong questions:\n${JSON.stringify(wrongQuestions, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_videos",
            description: "Return video suggestions for the student",
            parameters: {
              type: "object",
              properties: {
                weakTopics: { type: "array", items: { type: "string" } },
                videos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      channel: { type: "string" },
                      url: { type: "string" },
                      description: { type: "string" },
                      topic: { type: "string" },
                    },
                    required: ["title", "channel", "url", "description", "topic"],
                  },
                },
                overallAdvice: { type: "string" },
              },
              required: ["weakTopics", "videos", "overallAdvice"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_videos" } },
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
    console.error("recommend-videos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
