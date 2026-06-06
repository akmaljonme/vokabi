import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const tg = async (method: string, body: unknown) => {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

const normalize = (p: string) => "+" + p.replace(/[^\d]/g, "");

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  try {
    const update = await req.json();
    const msg = update.message;
    if (!msg) return new Response("ok");
    const chatId = msg.chat.id;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    if (msg.contact && msg.contact.user_id === msg.from.id) {
      const phone = normalize(msg.contact.phone_number);
      await supabase.from("telegram_phone_links").upsert({
        phone,
        chat_id: chatId,
        username: msg.from.username ?? null,
        first_name: msg.from.first_name ?? null,
      }, { onConflict: "phone" });
      await tg("sendMessage", {
        chat_id: chatId,
        text: `✅ Raqamingiz ulandi: ${phone}\n\nEndi Vokabi ilovasida shu raqamingiz bilan kirishingiz mumkin. Kod shu yerga keladi.`,
        reply_markup: { remove_keyboard: true },
      });
      return new Response("ok");
    }

    const text = (msg.text || "").trim();
    if (text.startsWith("/start") || text.toLowerCase().includes("kir")) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Salom! 👋\n\nVokabi'ga telefon raqamingiz bilan kirish uchun pastdagi tugmani bosing va raqamingizni ulashing.",
        reply_markup: {
          keyboard: [[{ text: "📱 Raqamni ulashish", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("ok");
  }
});