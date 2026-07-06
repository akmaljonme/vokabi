import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_VOICE_DAILY_LIMIT = 20;

// Simple in-memory LRU cache for repeated phrases within a warm instance
const ttsCache = new Map<string, ArrayBuffer>();
const CACHE_MAX = 100;
function cacheGet(key: string): ArrayBuffer | undefined {
  const v = ttsCache.get(key);
  if (v) { ttsCache.delete(key); ttsCache.set(key, v); }
  return v;
}
function cacheSet(key: string, buf: ArrayBuffer) {
  if (ttsCache.size >= CACHE_MAX) {
    const first = ttsCache.keys().next().value;
    if (first) ttsCache.delete(first);
  }
  ttsCache.set(key, buf);
}

async function assertAllowed(authHeader: string, mode: string | undefined): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY } });
  if (!userRes.ok) return { ok: false, status: 401, error: "Unauthorized" };
  const { id: userId } = await userRes.json();
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: sub } = await admin.from("subscriptions").select("plan, expires_at").eq("user_id", userId).maybeSingle();
  const active = sub && sub.plan === "pro" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  if (active) return { ok: true };
  // Voice-assistant mode: free users can use TTS within the daily voice quota
  if (mode === "voice_assistant") {
    const { data: row } = await admin.from("voice_usage").select("count").eq("user_id", userId).eq("used_date", new Date().toISOString().split("T")[0]).maybeSingle();
    if ((row?.count ?? 0) <= FREE_VOICE_DAILY_LIMIT) return { ok: true };
    return { ok: false, status: 429, error: "Kunlik ovozli limit tugadi" };
  }
  return { ok: false, status: 403, error: "Pro obuna kerak" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const body = await req.json();
    const { text, voiceId = "JBFqnCBsd6RMkjVDRZzb", mode } = body || {};
    const gate = await assertAllowed(authHeader, mode);
    if (!gate.ok) return new Response(JSON.stringify({ error: gate.error }), { status: gate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (text.length > 2000) {
      return new Response(JSON.stringify({ error: "Text too long (max 2000 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cacheKey = `${voiceId}::${text}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return new Response(cached, { headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "X-Cache": "HIT" } });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    cacheSet(cacheKey, audioBuffer.slice(0));

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
