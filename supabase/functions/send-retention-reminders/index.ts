import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VOKABI_URL = "https://vokabi.uz";

const tg = async (method: string, body: unknown) => {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

const buildMessage = (name: string, streak: number, xp: number) => {
  const greeting = name ? `Salom, ${name}!` : "Salom!";

  if (streak > 0) {
    return `🔥 <b>${greeting}</b>\n\n<b>${streak} kunlik streak</b>'ingiz xavf ostida! Bugun hali mashq qilmadingiz.\n\nUni yo'qotmaslik uchun hozir 5 daqiqa vaqt ajrating 💪`;
  }
  return `📚 <b>${greeting}</b>\n\nBugun ingliz tilini mashq qilishni unutmang! Hozirgi XP'ingiz: <b>${xp}</b>\n\nKichik qadam — katta natija 🚀`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: users, error } = await supabase.rpc("get_inactive_users_with_telegram");
    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const u of users || []) {
      try {
        const text = buildMessage(u.full_name, u.current_streak || 0, u.xp || 0);
        const res = await tg("sendMessage", {
          chat_id: u.chat_id,
          parse_mode: "HTML",
          text,
          reply_markup: {
            inline_keyboard: [[{ text: "🚀 Hozir mashq qilish", url: VOKABI_URL }]],
          },
        });

        if (res.ok) {
          sent++;
          await supabase.from("retention_reminders_sent").insert({ user_id: u.user_id });
        } else {
          failed++;
          console.error("Telegram send failed for", u.user_id, res);
        }
      } catch (e) {
        failed++;
        console.error("Error sending to", u.user_id, e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, total: users?.length || 0, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
