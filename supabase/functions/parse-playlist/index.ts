import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VideoItem {
  videoId: string;
  title: string;
  duration: string;
  index: number;
}

async function fetchPlaylistVideos(playlistId: string): Promise<VideoItem[]> {
  // Fetch the playlist page
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) throw new Error(`YouTube returned ${res.status}`);
  const html = await res.text();

  // Extract video data from the page using regex patterns
  const videos: VideoItem[] = [];

  // Find all video IDs and titles from the playlist renderer
  // Pattern: "videoId":"XXXXXXXXXXX" near "title":{"runs":[{"text":"..."}]}
  const videoIdRegex = /"playlistVideoRenderer":\{"videoId":"([\w-]{11})"/g;
  const videoIds: string[] = [];
  let match;
  while ((match = videoIdRegex.exec(html)) !== null) {
    videoIds.push(match[1]);
  }

  if (videoIds.length === 0) {
    // Try alternate pattern
    const altRegex = /"videoId"\s*:\s*"([\w-]{11})"/g;
    const seen = new Set<string>();
    while ((match = altRegex.exec(html)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        videoIds.push(match[1]);
      }
    }
  }

  // Extract titles - look for patterns near video renderers
  const titleRegex = /"title"\s*:\s*\{"runs"\s*:\s*\[\{"text"\s*:\s*"([^"]+)"/g;
  const titles: string[] = [];
  while ((match = titleRegex.exec(html)) !== null) {
    titles.push(match[1]);
  }

  // Extract durations
  const durationRegex = /"lengthText"\s*:\s*\{"accessibility"[^}]*\},"simpleText"\s*:\s*"([^"]+)"/g;
  const durations: string[] = [];
  while ((match = durationRegex.exec(html)) !== null) {
    durations.push(match[1]);
  }

  // Build video list - use the minimum of all arrays to stay in sync
  // Skip first few titles that might be playlist title/channel name
  // Find the offset where titles start matching video content
  let titleOffset = 0;
  if (titles.length > videoIds.length) {
    titleOffset = titles.length - videoIds.length;
    // But cap it at a reasonable number
    if (titleOffset > 5) titleOffset = 0;
  }

  const count = Math.min(videoIds.length, 200);
  for (let i = 0; i < count; i++) {
    videos.push({
      videoId: videoIds[i],
      title: titles[titleOffset + i] || `Video ${i + 1}`,
      duration: durations[i] || "",
      index: i,
    });
  }

  return videos;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { playlistUrl, defaultSkill } = await req.json();
    if (!playlistUrl) throw new Error("Playlist URL kerak");

    const plMatch = playlistUrl.match(/[?&]list=([\w-]+)/);
    if (!plMatch) throw new Error("Noto'g'ri playlist URL");
    const playlistId = plMatch[1];

    console.log("Fetching playlist:", playlistId);
    const videos = await fetchPlaylistVideos(playlistId);
    console.log(`Found ${videos.length} videos`);

    if (videos.length === 0) throw new Error("Playlistda video topilmadi");

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
            content: `You categorize English learning video titles into skills. Return ONLY a valid JSON array of strings (no markdown, no explanation). Each string must be one of: "reading", "listening", "writing", "speaking", "grammar", "vocabulary". The array length MUST be exactly ${videos.length}. Analyze each title carefully. If a title is about tenses, verbs, articles, pronouns, prepositions etc → "grammar". If about words/meanings → "vocabulary". If about reading passages → "reading". If about listening/audio → "listening". If about essay/letter writing → "writing". If about pronunciation/conversation → "speaking". Default to "grammar" if unclear.`,
          },
          { role: "user", content: `Categorize these ${videos.length} videos:\n${videoList}` },
        ],
        temperature: 0.1,
      }),
    });

    let skills: string[] = [];
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      let content = aiData.choices?.[0]?.message?.content || "[]";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) skills = parsed;
      } catch {
        console.log("AI parse failed, using defaults");
      }
    }

    // Pad skills array if needed
    while (skills.length < videos.length) skills.push("grammar");

    const result = videos.map((v, i) => ({
      title: v.title,
      youtube_url: `https://www.youtube.com/watch?v=${v.videoId}&list=${playlistId}`,
      youtube_id: v.videoId,
      thumbnail_url: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      skill: defaultSkill || skills[i] || "grammar",
      level: "A1",
      duration: v.duration,
      order_index: i,
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
