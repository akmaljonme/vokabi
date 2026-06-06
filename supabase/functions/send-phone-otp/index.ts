import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const normalize = (p: string) => "+" + p.replace(/[^\d]/g, "");

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone: rawPhone } = await req.json();
    if (!rawPhone || typeof rawPhone !== "string") {
      return new Response(JSON.stringify({ error: "Telefon raqam kerak" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const phone = normalize(rawPhone);
    if (phone.length < 9) {
      return new Response(JSON.stringify({ error: "Noto'g'ri telefon raqam" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: link } = await supabase
      .from("telegram_phone_links")
      .select("chat_id")
      .eq("phone", phone)
      .maybeSingle();

    if (!link) {
      return new Response(JSON.stringify({
        error: "telegram_not_linked",
        message: "Avval @vokabi_bot ga /start bosib, raqamingizni ulashing.",
      }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeHash = await sha256(code + phone);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase.from("phone_otp_codes").insert({ phone, code_hash: codeHash, expires_at: expiresAt });

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: link.chat_id,
        text: `🔐 Vokabi kirish kodingiz:\n\n*${code}*\n\n5 daqiqa amal qiladi. Hech kim bilan baham ko'rmang.`,
        parse_mode: "Markdown",
      }),
    });
    if (!tgRes.ok) {
      const txt = await tgRes.text();
      console.error("Telegram error", txt);
      return new Response(JSON.stringify({ error: "Telegram orqali yuborib bo'lmadi" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, target: "telegram" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});