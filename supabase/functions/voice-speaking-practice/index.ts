import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_DAILY_LIMIT = 20;
const QUESTIONS_BEFORE_ASSESS = 4;

const SYSTEM_PROMPT = (part: number, topic?: string) => `You are an experienced IELTS Speaking examiner conducting Part ${part}. ${topic ? `Topic: ${topic}. ` : ""}

Rules:
- Speak ONLY in English, natural conversational tone, exactly like a real IELTS examiner
- Keep every turn SHORT: at most 2 sentences
- Ask exactly ONE question per turn, then stop
- Do not correct the student's grammar mid-exam
- Use natural follow-ups ("Interesting — could you tell me more about...", "And why is that?")
- Never use markdown, lists, asterisks, or emojis — plain spoken English only
- Part 1: personal familiar questions (home, work, hobbies, daily routine)
- Part 2: give a cue card if history is empty, otherwise ask a natural follow-up
- Part 3: abstract discussion questions related to the Part 2 topic`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY } });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { id: userId } = await userRes.json();

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: sub } = await admin.from("subscriptions").select("plan, expires_at").eq("user_id", userId).maybeSingle();
    const isPro = sub && sub.plan === "pro" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
    const { data: usedCount } = await admin.rpc("increment_voice_usage" as any, { _user_id: userId });
    if (!isPro && (usedCount ?? 0) > FREE_DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: "Kunlik ovozli so'rov limiti tugadi.", limit: FREE_DAILY_LIMIT }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { history, part = 1, topic } = await req.json();
    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    if (part < 1 || part > 3) {
      return new Response(JSON.stringify({ error: "part 1, 2 or 3" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY sozlanmagan");

    const messages = [
      { role: "system", content: SYSTEM_PROMPT(part, topic) },
      ...safeHistory.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 800) })),
    ];
    // If no history yet, prompt Gemini for opener
    if (safeHistory.length === 0) {
      messages.push({ role: "user", content: "Please begin the interview with your very first question." });
    }

    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify({ model: "gemini-2.0-flash", temperature: 0.7, max_tokens: 200, messages }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("Gemini error", geminiRes.status, errText);
      throw new Error(`Gemini ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
    const reply = (data.choices?.[0]?.message?.content || "").trim().replace(/^[*_`]+|[*_`]+$/g, "");

    const assistantTurns = safeHistory.filter((m: any) => m.role === "assistant").length + 1;
    const shouldAssess = assistantTurns >= QUESTIONS_BEFORE_ASSESS;

    return new Response(JSON.stringify({ reply, shouldAssess }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("voice-speaking-practice error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Xatolik" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});