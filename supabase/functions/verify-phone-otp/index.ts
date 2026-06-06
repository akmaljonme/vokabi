import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const normalize = (p: string) => "+" + p.replace(/[^\d]/g, "");
const phoneToEmail = (p: string) => `phone${p.replace(/\D/g, "")}@phone.vokabi.app`;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone: rawPhone, code } = await req.json();
    if (!rawPhone || !code) {
      return new Response(JSON.stringify({ error: "Telefon va kod kerak" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const phone = normalize(rawPhone);
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: otp } = await supabase
      .from("phone_otp_codes")
      .select("*")
      .eq("phone", phone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) return new Response(JSON.stringify({ error: "Kod topilmadi. Qayta yuboring." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (new Date(otp.expires_at) < new Date()) return new Response(JSON.stringify({ error: "Kod muddati o'tgan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (otp.attempts >= 5) return new Response(JSON.stringify({ error: "Juda ko'p urinish. Yangi kod so'rang." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const hash = await sha256(String(code) + phone);
    if (hash !== otp.code_hash) {
      await supabase.from("phone_otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return new Response(JSON.stringify({ error: "Kod noto'g'ri" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("phone_otp_codes").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);

    const email = phoneToEmail(phone);

    // Ensure user exists
    const { data: list } = await supabase.auth.admin.listUsers();
    let user = list.users.find((u: any) => u.email === email);
    if (!user) {
      const { data: created, error: cErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        phone: phone.replace("+", ""),
        user_metadata: { phone, login_method: "phone" },
      });
      if (cErr) {
        console.error("createUser", cErr);
        return new Response(JSON.stringify({ error: cErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      user = created.user;
    }

    // Generate magiclink → return hashed_token for client to verifyOtp
    const { data: linkData, error: lErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (lErr) {
      console.error("generateLink", lErr);
      return new Response(JSON.stringify({ error: lErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      ok: true,
      email,
      token_hash: linkData.properties?.hashed_token,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});