import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Siz Vokabi platformasining AI English tutorsiz. Vazifangiz foydalanuvchilarga ingliz tilini o'rganishda yordam berish.

Qoidalar:
- Har doim O'zbek tilida javob bering (grammatik misollar inglizcha bo'lishi mumkin)
- Qisqa, aniq va foydali javoblar bering
- Grammatika, lug'at, reading, listening, writing va speaking bo'yicha maslahatlar bering
- IELTS va CEFR darajalari (A1–C2) bo'yicha ma'lumot bering
- Foydalanuvchi xatolarini muloyimlik bilan tuzating va tushuntiring
- Markdown formatda javob bering (jadvallar, ro'yxatlar, qalin matn)
- Savollar berib, foydalanuvchini faol qiling`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Xato so'rov" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY sozlanmagan");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", response.status, err);
      return new Response(JSON.stringify({ error: "AI xizmati ishlamayapti" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text || "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
