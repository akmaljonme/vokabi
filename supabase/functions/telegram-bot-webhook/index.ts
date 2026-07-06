import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const normalize = (p: string) => "+" + p.replace(/[^\d]/g, "");

// ─── Main keyboard ───
const mainKeyboard = {
  inline_keyboard: [
    [
      { text: "🚀 Vokabini ochish", url: VOKABI_URL },
      { text: "📊 Statistika", callback_data: "stats" },
    ],
    [
      { text: "📚 Darslar", callback_data: "lessons" },
      { text: "🎯 Testlar", callback_data: "tests" },
    ],
    [
      { text: "🏆 Reyting", callback_data: "leaderboard" },
      { text: "💎 Pro rejasi", callback_data: "pro" },
    ],
    [
      { text: "📱 Raqamni ulash", callback_data: "link_phone" },
      { text: "❓ Yordam", callback_data: "help" },
    ],
  ],
};

// ─── Welcome message ───
const sendWelcome = async (chatId: number, firstName: string) => {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `🎓 <b>Vokabi'ga xush kelibsiz, ${firstName}!</b>

✨ <i>Ingliz tilini o'rganishning eng aqlli yo'li</i>

━━━━━━━━━━━━━━━━━━━━
🌟 <b>Nima qila olasiz?</b>

📖 IELTS & CEFR testlari
🤖 AI bilan yozma va og'zaki mashq
🎮 21+ interaktiv o'yinlar
📈 Shaxsiy progress tracking
🏅 Turnirlar va mukofotlar

━━━━━━━━━━━━━━━━━━━━
👇 <b>Kerakli bo'limni tanlang:</b>`,
    reply_markup: mainKeyboard,
  });
};

// ─── Stats message ───
const sendStats = async (chatId: number, supabase: any, userId?: string) => {
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: testCount } = await supabase
    .from("test_results")
    .select("*", { count: "exact", head: true });

  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `📊 <b>Vokabi statistikasi</b>

━━━━━━━━━━━━━━━━━━━━
👥 <b>Foydalanuvchilar:</b> ${(userCount || 0).toLocaleString()}+
✅ <b>Ishlangan testlar:</b> ${(testCount || 0).toLocaleString()}+
🎮 <b>O'yin turlari:</b> 21+
📚 <b>CEFR darajalari:</b> A1 → C2
🤖 <b>AI xizmatlar:</b> Writing, Speaking, Tutor
━━━━━━━━━━━━━━━━━━━━

🔥 <i>Har kuni minglab o'quvchi mashq qilmoqda!</i>`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Hozir boshlash", url: VOKABI_URL }],
        [{ text: "◀️ Ortga", callback_data: "back" }],
      ],
    },
  });
};

// ─── Lessons menu ───
const sendLessons = async (chatId: number) => {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `📚 <b>Vokabi darslari</b>

━━━━━━━━━━━━━━━━━━━━
<b>IELTS tayyorgarlik:</b>
📝 Writing Task 1 & 2
🗣️ Speaking Part 1-3  
👂 Listening
📖 Reading

<b>CEFR darajalari:</b>
🟢 A1-A2 (Boshlang'ich)
🔵 B1-B2 (O'rta)
🔴 C1-C2 (Yuqori)

<b>Maxsus bo'limlar:</b>
💬 AI Conversation Practice
📰 Maqolalar & Comprehension
🎯 Grammar Challenges
━━━━━━━━━━━━━━━━━━━━`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "▶️ Darslarni boshlash", url: `${VOKABI_URL}/skills` }],
        [{ text: "◀️ Ortga", callback_data: "back" }],
      ],
    },
  });
};

// ─── Tests menu ───
const sendTests = async (chatId: number) => {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `🎯 <b>Testlar markazi</b>

━━━━━━━━━━━━━━━━━━━━
<b>🤖 AI baholash:</b>
✍️ Writing — IELTS 4 mezon bo'yicha
🎤 Speaking — talaffuz va grammatika
📊 Natijalar + tuzatishlar

<b>📋 Standart testlar:</b>
🔤 Grammar & Vocabulary
👂 Listening comprehension
📖 Reading tests

<b>🏆 Musobaqalar:</b>
⚡ Tezkor turnirlar
🎮 O'yin rejimi
━━━━━━━━━━━━━━━━━━━━`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "📝 Test topshirish", url: `${VOKABI_URL}/skills` }],
        [{ text: "◀️ Ortga", callback_data: "back" }],
      ],
    },
  });
};

// ─── Leaderboard ───
const sendLeaderboard = async (chatId: number, supabase: any) => {
  const { data: top } = await supabase
    .from("profiles")
    .select("full_name, username, xp")
    .order("xp", { ascending: false })
    .limit(10);

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  const rows = (top || []).map((u: any, i: number) => {
    const name = u.full_name || u.username || "Foydalanuvchi";
    const xp = (u.xp || 0).toLocaleString();
    return `${medals[i]} <b>${name}</b> — ${xp} XP`;
  }).join("\n");

  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `🏆 <b>TOP-10 Reyting</b>

━━━━━━━━━━━━━━━━━━━━
${rows || "Hali hech kim yo'q 😅"}
━━━━━━━━━━━━━━━━━━━━
🔥 <i>Siz ham reytingga chiqing!</i>`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Mashq boshlash", url: VOKABI_URL }],
        [{ text: "◀️ Ortga", callback_data: "back" }],
      ],
    },
  });
};

// ─── Pro plan ───
const sendPro = async (chatId: number) => {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `💎 <b>Vokabi Pro</b>

━━━━━━━━━━━━━━━━━━━━
<b>Pro bilan nima qo'shiladi?</b>

✅ Cheksiz AI Writing baholash
✅ Cheksiz AI Speaking tahlil
✅ AI Tutor — istalgan vaqt
✅ Barcha premium testlar
✅ Kengaytirilgan analytics
✅ Sertifikatlar
✅ Prioritet yordam

━━━━━━━━━━━━━━━━━━━━
💰 <b>Narx:</b> Oyiga 49,000 so'm
🎁 <b>1 oy bepul sinab ko'ring!</b>
━━━━━━━━━━━━━━━━━━━━`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "💎 Pro olish", url: `${VOKABI_URL}/pricing` }],
        [{ text: "◀️ Ortga", callback_data: "back" }],
      ],
    },
  });
};

// ─── Help ───
const sendHelp = async (chatId: number) => {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `❓ <b>Yordam markazi</b>

━━━━━━━━━━━━━━━━━━━━
<b>Buyruqlar:</b>
/start — Asosiy menyu
/stats — Statistika
/lessons — Darslar
/tests — Testlar
/top — Reyting
/pro — Pro rejasi

<b>Savollaringiz bo'lsa:</b>
📧 support@vokabi.uz
🌐 ${VOKABI_URL}
━━━━━━━━━━━━━━━━━━━━
<i>Biz 24/7 yordam berishga tayyormiz!</i>`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "📞 Bog'lanish", callback_data: "contact" }],
        [{ text: "◀️ Ortga", callback_data: "back" }],
      ],
    },
  });
};

// ─── Contact ───
const sendContact = async (chatId: number) => {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `📞 <b>Biz bilan bog'laning</b>

━━━━━━━━━━━━━━━━━━━━
🌐 <b>Sayt:</b> <a href="${VOKABI_URL}">vokabi.uz</a>
📧 <b>Email:</b> support@vokabi.uz
📱 <b>Telegram:</b> @vokabi_support
━━━━━━━━━━━━━━━━━━━━
<i>Istalgan savolingizga javob beramiz!</i>`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Saytga o'tish", url: VOKABI_URL }],
        [{ text: "◀️ Ortga", callback_data: "back" }],
      ],
    },
  });
};

// ─── Phone linking ───
const sendPhoneRequest = async (chatId: number) => {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `📱 <b>Telefon raqamni ulash</b>

Vokabi ilovasiga telefon raqamingiz bilan kirish uchun pastdagi tugmani bosing.`,
    reply_markup: {
      keyboard: [[{ text: "📱 Raqamni ulashish", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
};

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  try {
    const update = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── Callback query (inline button press) ──
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;

      await tg("answerCallbackQuery", { callback_query_id: cb.id });

      if (data === "back") {
        await sendWelcome(chatId, cb.from.first_name || "Do'st");
      } else if (data === "stats") {
        await sendStats(chatId, supabase);
      } else if (data === "lessons") {
        await sendLessons(chatId);
      } else if (data === "tests") {
        await sendTests(chatId);
      } else if (data === "leaderboard") {
        await sendLeaderboard(chatId, supabase);
      } else if (data === "pro") {
        await sendPro(chatId);
      } else if (data === "help") {
        await sendHelp(chatId);
      } else if (data === "contact") {
        await sendContact(chatId);
      } else if (data === "link_phone") {
        await sendPhoneRequest(chatId);
      }

      return new Response("ok");
    }

    // ── Message ──
    const msg = update.message;
    if (!msg) return new Response("ok");
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || "Do'st";

    // Phone contact shared
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
        parse_mode: "HTML",
        text: `✅ <b>Raqam muvaffaqiyatli ulandi!</b>

📱 <b>Raqam:</b> <code>${phone}</code>

Endi Vokabi ilovasida shu raqam bilan kirishingiz mumkin. OTP kod shu yerga keladi.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Vokabini ochish", url: VOKABI_URL }],
            [{ text: "🏠 Asosiy menyu", callback_data: "back" }],
          ],
          remove_keyboard: true,
        },
      });
      return new Response("ok");
    }

    const text = (msg.text || "").trim();

    // Commands
    if (text.startsWith("/start")) {
      await sendWelcome(chatId, firstName);
    } else if (text.startsWith("/stats")) {
      await sendStats(chatId, supabase);
    } else if (text.startsWith("/lessons")) {
      await sendLessons(chatId);
    } else if (text.startsWith("/tests")) {
      await sendTests(chatId);
    } else if (text.startsWith("/top")) {
      await sendLeaderboard(chatId, supabase);
    } else if (text.startsWith("/link")) {
      await sendPhoneRequest(chatId);
    } else if (text.startsWith("/pro")) {
      await sendPro(chatId);
    } else if (text.startsWith("/help")) {
      await sendHelp(chatId);
    } else {
      // Default: show main menu
      await sendWelcome(chatId, firstName);
    }

    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("ok");
  }
});
