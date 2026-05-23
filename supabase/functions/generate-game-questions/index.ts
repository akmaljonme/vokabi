import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const gamePrompts: Record<string, (level: string) => string> = {
  word_match: (level) => `Generate 6 English-Uzbek word pairs for level ${level}. 
Return JSON array: [{"en": "word", "uz": "tarjima"}]
Words must match CEFR ${level} level. No duplicates. Only return the JSON array.`,

  spelling_bee: (level) => `Generate 8 English words for a spelling bee game at CEFR ${level} level.
Return JSON array: [{"word": "necessary", "hint": "Must be done"}]
Hints should be short (2-4 words). Only return the JSON array.`,

  grammar_battle: (level) => `Generate 8 English grammar questions for CEFR ${level} level.
Return JSON array: [{"question": "She ___ to school.", "options": ["go", "goes", "going", "gone"], "correct": 1, "explanation": "Third person singular"}]
"correct" is 0-indexed. Only return the JSON array.`,

  idiom_master: (_level) => `Generate 8 English idioms quiz questions.
Return JSON array: [{"idiom": "Break the ice", "meaning": "Start conversation", "meaningUz": "Suhbatni boshlash", "options": ["Option A uz", "Option B uz", "Option C uz", "Option D uz"], "correct": 1, "example": "He told a joke to break the ice."}]
"correct" is 0-indexed. Options should be in Uzbek. Only return the JSON array.`,

  sentence_builder: (level) => `Generate 6 English sentences for a sentence builder game at CEFR ${level} level.
Return JSON array: [{"words": ["I", "am", "a", "student"], "correct": "I am a student", "translation": "Men talabaman"}]
Translation in Uzbek. Only return the JSON array.`,

  listening_quiz: (level) => `Generate 5 English listening comprehension questions for CEFR ${level} level.
Return JSON array: [{"text": "Short English paragraph (2-3 sentences)", "question": "Question in Uzbek?", "options": ["Option1 uz", "Option2 uz", "Option3 uz", "Option4 uz"], "correct": 1}]
"correct" is 0-indexed. Options in Uzbek. Only return the JSON array.`,

  hangman: (level) => `Generate 8 English words with Uzbek hints for a hangman game at CEFR ${level} level.
Return JSON array: [{"word": "APPLE", "hint": "Meva"}]
Words must be UPPERCASE, 4-10 letters. Hints in Uzbek, 1-2 words. Only return the JSON array.`,

  flashcards: (level) => `Generate 6 English vocabulary flashcards for CEFR ${level} level.
Return JSON array: [{"front": "Accomplish", "back": "Erishmoq, bajarmoq", "example": "She accomplished her goal."}]
Back in Uzbek. Example in English. Only return the JSON array.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, { headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" } });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { gameType, level } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const promptFn = gamePrompts[gameType];
    if (!promptFn) throw new Error(`Unknown game type: ${gameType}`);

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a JSON generator. Only output valid JSON arrays. No markdown, no explanation." },
          { role: "user", content: promptFn(level || "A1") },
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const questions = JSON.parse(content);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
