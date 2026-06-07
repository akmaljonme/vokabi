import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Siz Vokabi platformasining AI English tutorsiz. Foydalanuvchilarga ingliz tilini o'rganishda yordam berasiz.

Qoidalar:
- Har doim O'zbek tilida javob bering (grammatik misollar inglizcha bo'lishi mumkin)
- Oddiy, tabiiy va samimiy tarzda yozing — xuddi do'st suhbatidek
- Qisqa va aniq bo'ling — keraksiz uzun tushuntirishlardan saqlaning
- HECH QACHON markdown formatidan foydalanmang: ### yoki ** yoki * yoki - ro'yxat belgisi YOZMANG
- Misollarni oddiy matn sifatida yozing, masalan: "Good morning!" — bu salomlashish
- IELTS, CEFR, grammatika, lug'at, speaking, writing bo'yicha maslahat bering
- Xatolarni muloyimlik bilan tuzating`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Xato so'rov" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY sozlanmagan");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", response.status, err);
      throw new Error(`Gemini API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

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
