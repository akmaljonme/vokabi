import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wrongQuestions, level, skill } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a helpful English learning assistant. Based on the student's wrong answers, identify weak topics and suggest YouTube video searches.

CRITICAL RULES FOR URLs:
- You MUST generate YouTube SEARCH URLs in this exact format: https://www.youtube.com/results?search_query=ENCODED_SEARCH_TERM
- The search query must be URL-encoded (spaces become +, special chars encoded)
- Make search queries specific and useful, like: "english+grammar+present+perfect+tense+lesson" or "IELTS+reading+tips+for+beginners"
- NEVER invent fake video IDs or direct video links like youtube.com/watch?v=...
- Each URL must be a YouTube search URL that will show real results when clicked

For the "channel" field, suggest a well-known English learning channel name that would likely appear in those search results (e.g., "BBC Learning English", "English with Lucy", "EngVid", "IELTS Liz").

Write all descriptions in Uzbek language.
Level: ${level}, Skill: ${skill}`;

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
            description: "Return video suggestions for the student. URLs MUST be YouTube search URLs in format: https://www.youtube.com/results?search_query=...",
            parameters: {
              type: "object",
              properties: {
                weakTopics: { type: "array", items: { type: "string" }, description: "List of weak grammar/vocabulary topics identified" },
                videos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Descriptive title for this video search suggestion" },
                      channel: { type: "string", description: "Name of a well-known English learning YouTube channel" },
                      url: { type: "string", description: "YouTube search URL in format: https://www.youtube.com/results?search_query=encoded+search+terms" },
                      description: { type: "string", description: "Description in Uzbek language of what this search will help with" },
                      topic: { type: "string", description: "The specific grammar/vocabulary topic" },
                      searchQuery: { type: "string", description: "The human-readable search query used" },
                    },
                    required: ["title", "channel", "url", "description", "topic"],
                  },
                },
                overallAdvice: { type: "string", description: "Overall learning advice in Uzbek language" },
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

    // Validate and fix URLs - ensure all are YouTube search URLs
    if (result?.videos) {
      result.videos = result.videos.map((video: any) => {
        // If the URL is not a proper YouTube search URL, convert it
        if (!video.url.includes('youtube.com/results?search_query=')) {
          // Extract meaningful text from the title/topic for search
          const searchTerm = `${video.topic} ${video.channel} english lesson`.replace(/\s+/g, '+');
          video.url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm).replace(/%20/g, '+')}`;
        }
        return video;
      });
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
