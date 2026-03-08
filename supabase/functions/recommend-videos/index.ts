import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wrongQuestions, level, skill } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an English learning assistant. Analyze the student's wrong answers and identify weak topics.
For each weak topic, create a YouTube search query that would find helpful tutorial videos.

CRITICAL RULES:
- Do NOT generate any URLs. Only generate search queries as plain text strings.
- Search queries should be in English, specific, and designed to find educational content.
- Examples of good search queries: "present perfect tense English lesson", "IELTS reading skimming techniques", "English vocabulary B1 level"
- For the channel field, suggest real well-known channels: "BBC Learning English", "English with Lucy", "EngVid", "IELTS Liz", "Rachel's English", "Learn English with TV Series"
- Write all descriptions in Uzbek language.
- Level: ${level}, Skill: ${skill}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Wrong questions:\n${JSON.stringify(wrongQuestions, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_videos",
            description: "Return video search suggestions. Do NOT include any URLs - only search query strings.",
            parameters: {
              type: "object",
              properties: {
                weakTopics: { type: "array", items: { type: "string" }, description: "List of weak topics identified" },
                videos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Descriptive title for this suggestion" },
                      channel: { type: "string", description: "Real well-known English learning YouTube channel name" },
                      searchQuery: { type: "string", description: "Plain text YouTube search query, e.g. 'present perfect tense English grammar lesson'" },
                      description: { type: "string", description: "Description in Uzbek of what this will help with" },
                      topic: { type: "string", description: "The specific topic this covers" },
                    },
                    required: ["title", "channel", "searchQuery", "description", "topic"],
                  },
                },
                overallAdvice: { type: "string", description: "Overall learning advice in Uzbek" },
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
      const errorBody = await response.text();
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Kredit yetarli emas" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error [${response.status}]: ${errorBody}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    // Build proper YouTube search URLs from the search queries
    if (result?.videos) {
      result.videos = result.videos.map((video: any) => ({
        ...video,
        url: buildYouTubeSearchUrl(video.searchQuery || `${video.topic} ${video.channel} english lesson`),
      }));
    }

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
