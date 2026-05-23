import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // AuthN
    const authHeader = req.headers.get("Authorization") || "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, { headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" } });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid or too many messages" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const totalLen = messages.reduce((s: number, m: any) => s + (typeof m?.content === "string" ? m.content.length : 0), 0);
    if (totalLen > 20000) {
      return new Response(JSON.stringify({ error: "Message content too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: `Siz Vokabi platformasining AI tutorsiz. Sizning vazifangiz foydalanuvchilarga ingliz tili o'rganishda yordam berish.

Qoidalar:
- Har doim O'zbek tilida javob bering (grammatik tushuntirishlar ingliz tilida bo'lishi mumkin)
- Qisqa va aniq javoblar bering
- Grammatika, lug'at, reading, listening, writing va speaking bo'yicha maslahatlar bering
- IELTS va CEFR darajalari bo'yicha ma'lumot bering
- Foydalanuvchini rag'batlantiring va motivatsiya qiling
- Markdown formatda javob bering
- Savollar berib, foydalanuvchini mashq qildiring
- Xatolarni tuzatib, tushuntirish bering`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Juda ko'p so'rov. Biroz kuting." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit yetarli emas." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmati vaqtincha ishlamayapti" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
