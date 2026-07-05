import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_DAILY_LIMIT = 20;

const SYSTEM_PROMPT = `Siz Vokabi ta'lim platformasining ovozli yordamchisi Alisa siz. Foydalanuvchi ovozli buyrug'ini tahlil qilib, FAQAT quyidagi JSON formatda javob bering (boshqa hech narsa yozmang, faqat JSON, kod bloki belgilarisiz):

{
  "intent": "navigate" | "action" | "chat",
  "path": "/dashboard" | "/games" | "/practice" | "/exams" | "/leaderboard" | "/pricing" | "/articles" | "/community" | "/word-bank" | "/mock-tests" | "/tools" | "/languages" | null,
  "action": "start_test" | "open_random_game" | "open_speaking_practice" | null,
  "reply": "foydalanuvchiga aytiladigan qisqa ovozli javob (o'zbek tilida, 1-2 gap, faqat tabiiy gapiruvchi matn — markdown, ro'yxat belgilari YO'Q)"
}

Qoidalar:
- Sahifaga o'tish ("dashboardni och", "o'yinlarga o't", "reyting", "mock testlar") -> intent: "navigate"
- Aniq amal ("test boshla", "tasodifiy o'yin", "speaking mashqi boshla") -> intent: "action"
- Savol yoki suhbat (IELTS haqida, umumiy savol) -> intent: "chat" va reply'da to'liq foydali javob bering
- reply MAJBURIY, har doim to'ldirilgan bo'lishi kerak
- reply ovozda o'qiladi, shuning uchun markdown, yulduzchalar, ro'yxatlar ishlatmang`;

function stripJsonFence(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

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

    // Enforce daily limit for non-pro users
    const { data: sub } = await admin.from("subscriptions").select("plan, expires_at").eq("user_id", userId).maybeSingle();
    const isPro = sub && sub.plan === "pro" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
    const { data: usedCount } = await admin.rpc("increment_voice_usage" as any, { _user_id: userId });
    if (!isPro && (usedCount ?? 0) > FREE_DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: "Kunlik ovozli so'rov limiti tugadi. Pro obuna oling yoki AI Tutor'dan matn orqali foydalaning.", limit: FREE_DAILY_LIMIT }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transcript, currentPath, conversationHistory } = await req.json();
    if (typeof transcript !== "string" || transcript.trim().length === 0 || transcript.length > 1000) {
      return new Response(JSON.stringify({ error: "Noto'g'ri transkript" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY sozlanmagan");

    const historyMessages = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-6).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 500) }))
      : [];

    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...historyMessages,
          { role: "user", content: `Joriy sahifa: ${currentPath || "/"}\nBuyruq: ${transcript}` },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("Gemini error", geminiRes.status, errText);
      if (geminiRes.status === 429) return new Response(JSON.stringify({ error: "AI band, biroz kuting." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Gemini ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(stripJsonFence(raw));
    } catch (_e) {
      parsed = { intent: "chat", path: null, action: null, reply: raw.slice(0, 500) };
    }

    const result = {
      intent: ["navigate", "action", "chat"].includes(parsed.intent) ? parsed.intent : "chat",
      path: typeof parsed.path === "string" && parsed.path.startsWith("/") ? parsed.path : null,
      action: typeof parsed.action === "string" ? parsed.action : null,
      reply: typeof parsed.reply === "string" ? parsed.reply.slice(0, 600) : "Kechirasiz, tushunmadim. Qaytadan urinib ko'ring.",
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("voice-assistant-command error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Xatolik" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});