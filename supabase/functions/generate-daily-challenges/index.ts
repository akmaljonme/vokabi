import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization") || "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, { headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" } });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { id: userId } = await userRes.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split("T")[0];

    // Anyone authenticated can read today's challenges
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("challenge_date", today);

    if (existing && existing.length >= 3) {
      return new Response(JSON.stringify({ challenges: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only admins may trigger AI generation (prevents credit abuse).
    // Non-admins get whatever exists (possibly empty) without error.
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ challenges: existing || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 3 daily challenges via AI
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You generate daily English learning challenges in JSON. Only output valid JSON array. No markdown.",
          },
          {
            role: "user",
            content: `Generate 3 unique daily English learning challenges for today. Each challenge should be different type.
Types: vocabulary, grammar, reading, listening_comprehension, sentence_building
Return JSON array:
[{
  "challenge_type": "vocabulary",
  "title": "Word Power Challenge",
  "title_uz": "So'z boyitish",
  "description": "Learn and practice 5 new words",
  "description_uz": "5 ta yangi so'z o'rganing",
  "difficulty": "medium",
  "xp_reward": 50,
  "challenge_data": {
    "questions": [
      {"question": "What does 'benevolent' mean?", "options": ["Kind", "Angry", "Sad", "Tired"], "correct": 0, "explanation": "Benevolent means well-meaning and kindly"}
    ]
  }
}]
Each challenge must have exactly 5 questions in challenge_data.questions. Mix difficulties: one easy (30xp), one medium (50xp), one hard (75xp). Only return the JSON array.`,
          },
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const challenges = JSON.parse(content);

    // Insert challenges
    const insertData = challenges.map((c: any) => ({
      challenge_date: today,
      challenge_type: c.challenge_type,
      title: c.title_uz || c.title,
      description: c.description_uz || c.description,
      challenge_data: c.challenge_data,
      xp_reward: c.xp_reward || 50,
      difficulty: c.difficulty || "medium",
    }));

    const { data: inserted, error } = await supabase
      .from("daily_challenges")
      .upsert(insertData, { onConflict: "challenge_date,challenge_type" })
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ challenges: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
