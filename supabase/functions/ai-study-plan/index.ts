import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, { headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" } });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { results } = await req.json();
    const resultsStr = JSON.stringify(results || []);
    if (resultsStr.length > 20000) {
      return new Response(JSON.stringify({ error: "Results payload too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `You are an expert IELTS/CEFR study planner. Analyze these test results and create a personalized weekly study plan in Uzbek language.

Test results: ${JSON.stringify(results)}

Return a JSON object with this exact structure (no markdown, just JSON):
{
  "currentLevel": "B1",
  "targetLevel": "B2",
  "weakSkills": [
    {"skill": "Listening", "score": 45, "priority": "high"},
    {"skill": "Grammar", "score": 60, "priority": "medium"}
  ],
  "weeklyPlan": [
    {"day": "Du", "focus": "Listening mashq", "duration": "45 min", "activities": ["Audio tinglash", "Note-taking", "Gap-fill"]},
    {"day": "Se", "focus": "Reading tahlil", "duration": "30 min", "activities": ["Skimming", "Scanning", "True/False"]},
    {"day": "Ch", "focus": "Grammar", "duration": "40 min", "activities": ["Tenses", "Conditionals"]},
    {"day": "Pa", "focus": "Writing", "duration": "45 min", "activities": ["Essay yozish", "AI tekshirish"]},
    {"day": "Ju", "focus": "Vocabulary", "duration": "30 min", "activities": ["Flashcards", "Word games"]},
    {"day": "Sh", "focus": "Speaking", "duration": "30 min", "activities": ["AI bilan suhbat", "Pronunciation"]},
    {"day": "Ya", "focus": "Mock test", "duration": "60 min", "activities": ["Full test", "Natijalarni tahlil qilish"]}
  ],
  "tips": [
    "Har kuni kamida 30 daqiqa ingliz tilida mashq qiling",
    "Zaif ko'nikmalaringizga ko'proq vaqt ajrating"
  ],
  "estimatedWeeks": 8
}

Analyze the actual results carefully:
- Determine current level from average scores
- Identify weak skills (below 70%)
- Set realistic target level (one step up)
- Create varied daily plan focusing more on weak areas
- Give 3-5 specific actionable tips in Uzbek
- Estimate weeks needed based on gap between current and target level`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Juda ko'p so'rov, biroz kuting" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI xizmat uchun kredit yetarli emas" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let plan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      }
    } catch {
      throw new Error("AI javobini tahlil qilib bo'lmadi");
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Xatolik" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
