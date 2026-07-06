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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY sozlanmagan");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI Gateway error:", response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Juda ko'p so'rov. Bir oz kuting va qayta urinib ko'ring." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI kreditlari tugadi. Workspace'ga kredit qo'shing." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
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
