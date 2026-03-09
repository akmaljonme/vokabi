import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { playlistUrl, defaultLevel } = await req.json();
    if (!playlistUrl) throw new Error("Playlist URL kerak");

    // Extract playlist ID
    const match = playlistUrl.match(/[?&]list=([\w-]+)/);
    if (!match) throw new Error("Noto'g'ri playlist URL");
    const playlistId = match[1];

    // Fetch playlist page HTML
    const pageRes = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!pageRes.ok) throw new Error("Playlist sahifasini yuklashda xato");
    const html = await pageRes.text();

    // Extract ytInitialData JSON
    const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!dataMatch) throw new Error("Playlist ma'lumotlarini o'qib bo'lmadi");

    let ytData: any;
    try { ytData = JSON.parse(dataMatch[1]); } catch { throw new Error("Playlist JSON parse xatosi"); }

    // Navigate to playlist items
    const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs;
    const tab = tabs?.[0];
    const sectionList = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
    const itemSection = sectionList?.[0]?.itemSectionRenderer?.contents;
    const playlistItems = itemSection?.[0]?.playlistVideoListRenderer?.contents;

    if (!playlistItems || playlistItems.length === 0) throw new Error("Playlistda video topilmadi");

    // Extract video info
    const videos: { videoId: string; title: string; duration: string; index: number }[] = [];
    for (const item of playlistItems) {
      const renderer = item.playlistVideoRenderer;
      if (!renderer) continue;
      const videoId = renderer.videoId;
      const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || "";
      const duration = renderer.lengthText?.simpleText || "";
      const index = parseInt(renderer.index?.simpleText || "0");
      if (videoId && title) videos.push({ videoId, title, duration, index });
    }

    if (videos.length === 0) throw new Error("Videolar topilmadi");

    // Use AI to categorize videos by skill
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const videoList = videos.map((v, i) => `${i}. "${v.title}"`).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You categorize English learning video titles into skills. Return ONLY a valid JSON array of strings. Each string must be one of: "reading", "listening", "writing", "speaking", "grammar", "vocabulary". The array length must match the number of videos. Analyze each title and assign the most fitting skill. If unclear, use "grammar" as default.`,
          },
          { role: "user", content: `Categorize these ${videos.length} videos:\n${videoList}` },
        ],
        temperature: 0.2,
      }),
    });

    let skills: string[] = [];
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      let content = aiData.choices?.[0]?.message?.content || "[]";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        skills = JSON.parse(content);
      } catch {
        skills = videos.map(() => "grammar");
      }
    } else {
      skills = videos.map(() => "grammar");
    }

    // Build result
    const result = videos.map((v, i) => ({
      title: v.title,
      youtube_url: `https://www.youtube.com/watch?v=${v.videoId}&list=${playlistId}`,
      youtube_id: v.videoId,
      thumbnail_url: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      skill: skills[i] || "grammar",
      level: defaultLevel || "A1",
      duration: v.duration,
      order_index: v.index || i,
      is_active: true,
    }));

    return new Response(JSON.stringify({ videos: result, total: result.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-playlist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
