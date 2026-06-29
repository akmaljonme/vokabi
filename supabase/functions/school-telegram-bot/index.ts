import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const tg = async (method: string, body: unknown) => {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

async function sendDailyReport(supabase: any, school: any) {
  if (!school.telegram_chat_id) return;

  const { data: classes } = await supabase
    .from("school_classes").select("id, name").eq("school_id", school.id);
  if (!classes?.length) return;

  const { data: students } = await supabase
    .from("school_students").select("user_id")
    .in("class_id", classes.map((c: any) => c.id));
  if (!students?.length) return;

  const userIds = students.map((s: any) => s.user_id);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const { count: todayTests } = await supabase
    .from("test_results").select("*", { count: "exact", head: true })
    .in("user_id", userIds).gte("created_at", today.toISOString());

  const { data: activeToday } = await supabase
    .from("test_results").select("user_id")
    .in("user_id", userIds).gte("created_at", today.toISOString());

  const activeCount = new Set(activeToday?.map((r: any) => r.user_id)).size;

  const { data: topResult } = await supabase
    .from("test_results").select("user_id, percentage")
    .in("user_id", userIds).gte("created_at", today.toISOString())
    .order("percentage", { ascending: false }).limit(1);

  let topName = "—";
  if (topResult?.length) {
    const { data: profile } = await supabase
      .from("profiles").select("full_name, username")
      .eq("user_id", topResult[0].user_id).single();
    topName = profile?.full_name || profile?.username || "Foydalanuvchi";
  }

  const date = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });

  await tg("sendMessage", {
    chat_id: school.telegram_chat_id,
    parse_mode: "HTML",
    text: `📊 <b>${school.name} — Kunlik hisobot</b>
📅 ${date}

━━━━━━━━━━━━━━━━━━━━
👥 <b>Jami o'quvchilar:</b> ${students.length}
✅ <b>Bugun faol:</b> ${activeCount} ta
📝 <b>Topshirilgan testlar:</b> ${todayTests || 0} ta
🏆 <b>Eng yaxshi:</b> ${topName}
━━━━━━━━━━━━━━━━━━━━

${activeCount < students.length / 2 ? "⚠️ O'quvchilarning yarmi bugun mashq qilmadi!" : "🎉 Bugun yaxshi faollik!"}

🔗 <a href="https://vokabi.uz/school/admin">Admin panelda batafsil →</a>`,
    reply_markup: {
      inline_keyboard: [[
        { text: "📊 Admin panel", url: "https://vokabi.uz/school/admin" },
      ]],
    },
  });
}

async function sendStudentReminders(supabase: any, school: any) {
  const { data: classes } = await supabase
    .from("school_classes").select("id").eq("school_id", school.id);
  if (!classes?.length) return;

  const { data: students } = await supabase
    .from("school_students").select("user_id")
    .in("class_id", classes.map((c: any) => c.id));
  if (!students?.length) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (const s of students) {
    const { count } = await supabase
      .from("test_results").select("*", { count: "exact", head: true })
      .eq("user_id", s.user_id).gte("created_at", today.toISOString());

    if (count === 0) {
      const { data: profile } = await supabase
        .from("profiles").select("telegram_chat_id, full_name")
        .eq("user_id", s.user_id).single();

      if (profile?.telegram_chat_id) {
        await tg("sendMessage", {
          chat_id: profile.telegram_chat_id,
          parse_mode: "HTML",
          text: `👋 <b>Salom, ${profile.full_name || "Do'stim"}!</b>

Bugun hali mashq qilmadingiz! 😊

📚 5 daqiqa vaqt ajrating — bir test topshiring!
🔥 Streak uzilmasin!`,
          reply_markup: {
            inline_keyboard: [[
              { text: "🚀 Vokabi ni ochish", url: "https://vokabi.uz/practice" },
            ]],
          },
        });
      }
    }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { action, school_id } = await req.json();

    if (action === "daily_report") {
      if (school_id) {
        const { data: school } = await supabase.from("schools").select("*").eq("id", school_id).single();
        if (school) await sendDailyReport(supabase, school);
      } else {
        const { data: schools } = await supabase.from("schools").select("*").not("telegram_chat_id", "is", null);
        for (const school of schools || []) await sendDailyReport(supabase, school);
      }
    } else if (action === "reminders") {
      const { data: schools } = await supabase.from("schools").select("*");
      for (const school of schools || []) await sendStudentReminders(supabase, school);
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
