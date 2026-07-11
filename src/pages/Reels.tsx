import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Loader2,
  X,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FollowButton } from "@/components/friends/FollowButton";
import { createNotification } from "@/lib/notifications";
import { FeedLogo } from "@/components/dashboard/DashboardIllustrations";

interface Reel {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
  likes_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  comments_count: number;
}

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

const PAGE_SIZE = 8;

export default function Reels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startId = searchParams.get("start");

  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState<Reel | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const enrich = useCallback(
    async (rows: any[]): Promise<Reel[]> => {
      const ids = rows.map((r) => r.id);
      const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const [{ data: profiles }, { data: likes }, { data: saves }, { data: commentCounts }] = await Promise.all([
        authorIds.length
          ? supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds)
          : Promise.resolve({ data: [] }),
        ids.length ? supabase.from("post_likes").select("post_id, user_id").in("post_id", ids) : Promise.resolve({ data: [] }),
        ids.length && user
          ? supabase.from("post_saves").select("post_id").eq("user_id", user.id).in("post_id", ids)
          : Promise.resolve({ data: [] }),
        ids.length ? supabase.from("post_comments").select("post_id").in("post_id", ids) : Promise.resolve({ data: [] }),
      ]);
      return rows.map((r) => {
        const rLikes = (likes || []).filter((l: any) => l.post_id === r.id);
        const profile = profiles?.find((p: any) => p.user_id === r.user_id);
        return {
          ...r,
          author_name: profile?.full_name || "Foydalanuvchi",
          author_avatar: profile?.avatar_url || null,
          likes_count: rLikes.length,
          liked_by_me: rLikes.some((l: any) => l.user_id === user?.id),
          saved_by_me: (saves || []).some((s: any) => s.post_id === r.id),
          comments_count: (commentCounts || []).filter((c: any) => c.post_id === r.id).length,
        };
      });
    },
    [user],
  );

  const load = useCallback(
    async (reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      const from = reset ? 0 : reels.length;
      const to = from + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("posts")
        .select("id, user_id, caption, media_url, created_at")
        .eq("type", "reel")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to);
      const rows = (data || []) as any[];
      const enriched = await enrich(rows);

      setReels((prev) => (reset ? enriched : [...prev, ...enriched]));
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [reels.length, enrich],
  );

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Agar ?start=<id> berilgan bo'lsa, o'sha reel hali ro'yxatda bo'lmasa alohida yuklab, boshiga qo'yamiz
  useEffect(() => {
    if (!startId || loading) return;
    if (reels.some((r) => r.id === startId)) return;
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, user_id, caption, media_url, created_at")
        .eq("id", startId)
        .maybeSingle();
      if (data) {
        const [enriched] = await enrich([data]);
        setReels((prev) => [enriched, ...prev.filter((r) => r.id !== enriched.id)]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startId, loading]);

  // Ekranda ko'rinayotgan reelni play qilish, qolganlarini pauza
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-reel-id");
          const video = id ? videoRefs.current[id] : null;
          if (!video) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.6, 1] },
    );
    const slides = container.querySelectorAll("[data-reel-id]");
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [reels]);

  // Oxiriga yaqinlashganda ko'proq yuklash
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - (scrollTop + clientHeight) < clientHeight * 1.5) {
      load(false);
    }
  };

  const toggleLike = async (reel: Reel) => {
    if (!user) return;
    const liked = reel.liked_by_me;
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id ? { ...r, liked_by_me: !liked, likes_count: r.likes_count + (liked ? -1 : 1) } : r,
      ),
    );
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", reel.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: reel.id, user_id: user.id });
      if (reel.user_id !== user.id) {
        createNotification({
          userId: reel.user_id,
          actorId: user.id,
          type: "like",
          title: "Reel'ingiz yoqdi!",
          body: "Reel'ingizga layk qo'ydi",
          relatedId: reel.id,
        });
      }
    }
  };

  const toggleSave = async (reel: Reel) => {
    if (!user) return;
    const saved = reel.saved_by_me;
    setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, saved_by_me: !saved } : r)));
    if (saved) {
      await supabase.from("post_saves").delete().eq("post_id", reel.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_saves").insert({ post_id: reel.id, user_id: user.id });
    }
  };

  const openComments = async (reel: Reel) => {
    setCommentsFor(reel);
    setLoadingComments(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", reel.id)
      .order("created_at", { ascending: true });
    const rows = (data || []) as CommentRow[];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      rows.forEach((r) => {
        r.author_name = profiles?.find((p: any) => p.user_id === r.user_id)?.full_name || "Foydalanuvchi";
      });
    }
    setComments(rows);
    setLoadingComments(false);
  };

  const submitComment = async () => {
    if (!user || !newComment.trim() || !commentsFor) return;
    setPostingComment(true);
    const content = newComment.trim();
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: commentsFor.id,
        user_id: user.id,
        content,
      });
      if (error) throw error;
      setComments((prev) => [
        ...prev,
        { id: `tmp-${Date.now()}`, user_id: user.id, content, created_at: new Date().toISOString(), author_name: "Siz" },
      ]);
      setReels((prev) =>
        prev.map((r) => (r.id === commentsFor.id ? { ...r, comments_count: r.comments_count + 1 } : r)),
      );
      setNewComment("");
      if (commentsFor.user_id !== user.id) {
        createNotification({
          userId: commentsFor.user_id,
          actorId: user.id,
          type: "comment",
          title: "Reel'ingizga izoh qoldirildi",
          body: content.slice(0, 120),
          relatedId: commentsFor.id,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Izoh qoldirilmadi");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[80]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[80] text-white gap-3 px-6 text-center">
        <FeedLogo className="w-14 h-14 opacity-70" />
        <p className="font-medium">Hali reel'lar yo'q</p>
        <button onClick={() => navigate("/feed")} className="text-sm text-primary mt-2">
          Feed'ga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[80] overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={() => navigate("/feed")} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <p className="text-white font-display font-bold flex items-center gap-1.5">
          <FeedLogo className="w-6 h-6" /> Reels
        </p>
        <button onClick={() => setMuted((m) => !m)} className="text-white">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {reels.map((reel) => (
          <div
            key={reel.id}
            data-reel-id={reel.id}
            className="relative h-screen w-full snap-start flex items-center justify-center"
          >
            <video
              ref={(el) => (videoRefs.current[reel.id] = el)}
              src={reel.media_url}
              className="h-full w-full object-contain bg-black"
              loop
              muted={muted}
              playsInline
              onClick={(e) => {
                const v = e.currentTarget;
                if (v.paused) v.play();
                else v.pause();
              }}
            />

            {/* Bottom-left: author + caption */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent">
              <button
                onClick={() => navigate(`/u/${reel.user_id}`)}
                className="flex items-center gap-2 mb-2"
              >
                <Avatar className="w-9 h-9 ring-1 ring-white/40">
                  {reel.author_avatar && <AvatarImage src={reel.author_avatar} />}
                  <AvatarFallback>{reel.author_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm font-semibold">{reel.author_name}</span>
              </button>
              {reel.user_id !== user?.id && (
                <div className="mb-2 w-fit">
                  <FollowButton targetUserId={reel.user_id} targetName={reel.author_name} />
                </div>
              )}
              {reel.caption && <p className="text-white text-sm max-w-[85%]">{reel.caption}</p>}
            </div>

            {/* Right action rail */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
              <button onClick={() => toggleLike(reel)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <Heart className={`w-7 h-7 ${reel.liked_by_me ? "fill-red-500 text-red-500" : "text-white"}`} />
                <span className="text-white text-[11px] font-semibold">{reel.likes_count}</span>
              </button>
              <button onClick={() => openComments(reel)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-white text-[11px] font-semibold">{reel.comments_count}</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/reels?start=${reel.id}`);
                  toast.success("Havola nusxalandi");
                }}
                className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
              >
                <Send className="w-7 h-7 text-white" />
              </button>
              <button onClick={() => toggleSave(reel)} className="active:scale-90 transition-transform">
                <Bookmark className={`w-7 h-7 ${reel.saved_by_me ? "fill-white text-white" : "text-white"}`} />
              </button>
            </div>
          </div>
        ))}
        {loadingMore && (
          <div className="h-24 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-white/70" />
          </div>
        )}
      </div>

      {/* Comments bottom sheet */}
      <AnimatePresence>
        {commentsFor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[90]"
              onClick={() => setCommentsFor(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[91] bg-background rounded-t-3xl max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <p className="font-semibold text-sm">{commentsFor.comments_count} ta izoh</p>
                <button onClick={() => setCommentsFor(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Birinchi izohni qoldiring!</p>
                ) : (
                  comments.map((c) => (
                    <p key={c.id} className="text-sm">
                      <span className="font-semibold mr-1.5">{c.author_name}</span>
                      {c.content}
                    </p>
                  ))
                )}
              </div>
              {user && (
                <div className="flex items-center gap-2 p-3 border-t border-border/50">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitComment()}
                    placeholder="Izoh qoldiring..."
                    className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {newComment.trim() && (
                    <button onClick={submitComment} disabled={postingComment} className="text-primary text-sm font-semibold shrink-0">
                      {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yuborish"}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
