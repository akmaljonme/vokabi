import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FollowButton } from "@/components/friends/FollowButton";

export interface FeedPost {
  id: string;
  user_id: string;
  type: "post" | "reel" | "poll";
  caption: string | null;
  media_url: string | null;
  media_type: "image" | "video" | null;
  poll_options: { text: string }[] | null;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
  likes_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  comments_count: number;
  poll_tally: number[];
  my_vote: number | null;
}

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hozir";
  if (mins < 60) return `${mins}d oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}s oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
};

interface Props {
  post: FeedPost;
  onChange?: (updated: Partial<FeedPost>) => void;
  onDelete?: () => void;
  hideFollow?: boolean;
}

export const PostCard = ({ post, onChange, onDelete, hideFollow }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const goToProfile = () => navigate(`/u/${post.user_id}`);

  const toggleLike = async () => {
    if (!user) return;
    const liked = post.liked_by_me;
    onChange?.({ liked_by_me: !liked, likes_count: post.likes_count + (liked ? -1 : 1) });
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    }
  };

  const toggleSave = async () => {
    if (!user) return;
    const saved = post.saved_by_me;
    onChange?.({ saved_by_me: !saved });
    if (saved) {
      await supabase.from("post_saves").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_saves").insert({ post_id: post.id, user_id: user.id });
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (!post.liked_by_me) toggleLike();
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 700);
    }
    setLastTap(now);
  };

  const vote = async (optionIndex: number) => {
    if (!user || post.my_vote !== null) return;
    onChange?.({
      my_vote: optionIndex,
      poll_tally: post.poll_tally.map((c, i) => (i === optionIndex ? c + 1 : c)),
    });
    await supabase.from("poll_votes").insert({ post_id: post.id, user_id: user.id, option_index: optionIndex });
  };

  const loadComments = async () => {
    setCommentsOpen((prev) => !prev);
    if (comments.length > 0 || loadingComments) return;
    setLoadingComments(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", post.id)
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
    if (!user || !newComment.trim()) return;
    setPosting(true);
    const content = newComment.trim();
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: user.id,
        content,
      });
      if (error) throw error;
      setComments((prev) => [
        ...prev,
        { id: `tmp-${Date.now()}`, user_id: user.id, content, created_at: new Date().toISOString(), author_name: "Siz" },
      ]);
      onChange?.({ comments_count: post.comments_count + 1 });
      setNewComment("");
    } catch (err) {
      console.error(err);
      toast.error("Izoh qoldirilmadi");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-3">
        <button onClick={goToProfile} className="shrink-0">
          <Avatar className="w-9 h-9">
            {post.author_avatar && <img src={post.author_avatar} className="w-full h-full object-cover rounded-full" />}
            <AvatarFallback>{post.author_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={goToProfile} className="text-sm font-semibold truncate hover:underline block">
            {post.author_name}
          </button>
          <p className="text-[11px] text-muted-foreground">
            {timeAgo(post.created_at)} · {post.type === "reel" ? "🎬 Reel" : post.type === "poll" ? "📊 So'rovnoma" : "📝 Post"}
          </p>
        </div>
        {!hideFollow && <FollowButton targetUserId={post.user_id} targetName={post.author_name} />}
        {post.user_id === user?.id && onDelete && (
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="relative" onClick={handleDoubleTap}>
          {post.media_type === "video" ? (
            <video src={post.media_url} className="w-full max-h-[520px] object-cover bg-black" controls />
          ) : (
            <img src={post.media_url} className="w-full max-h-[520px] object-cover select-none" draggable={false} />
          )}
          <AnimatePresence>
            {showHeartBurst && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.3 }}
                exit={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Caption for text-only posts */}
      {post.caption && post.type !== "poll" && (
        <p className="px-3.5 pt-3 text-sm">
          <button onClick={goToProfile} className="font-semibold mr-1.5 hover:underline">{post.author_name}</button>
          <span className="whitespace-pre-wrap">{post.caption}</span>
        </p>
      )}

      {/* Poll */}
      {post.type === "poll" && post.poll_options && (
        <div className="px-3.5 pt-3">
          {post.caption && <p className="text-sm font-semibold mb-2">{post.caption}</p>}
          <div className="space-y-2">
            {post.poll_options.map((opt, idx) => {
              const total = post.poll_tally.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((post.poll_tally[idx] / total) * 100) : 0;
              const voted = post.my_vote !== null;
              const isMine = post.my_vote === idx;
              return (
                <button
                  key={idx}
                  onClick={() => vote(idx)}
                  disabled={voted}
                  className={`w-full relative overflow-hidden rounded-xl border text-left p-2.5 text-sm transition-colors ${
                    isMine ? "border-primary" : "border-border/60"
                  } ${voted ? "cursor-default" : "hover:bg-muted/50"}`}
                >
                  {voted && <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${pct}%` }} />}
                  <div className="relative flex items-center justify-between">
                    <span className={isMine ? "font-semibold" : ""}>{opt.text}</span>
                    {voted && <span className="text-xs text-muted-foreground">{pct}%</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {post.poll_tally.reduce((a, b) => a + b, 0)} ta ovoz
          </p>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-3.5 px-3.5 pt-2.5">
        <button onClick={toggleLike} className="transition-transform active:scale-90">
          <Heart className={`w-6 h-6 ${post.liked_by_me ? "fill-red-500 text-red-500" : "text-foreground"}`} />
        </button>
        <button onClick={loadComments} className="transition-transform active:scale-90">
          <MessageCircle className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(`${window.location.origin}/feed?post=${post.id}`);
            toast.success("Havola nusxalandi");
          }}
          className="transition-transform active:scale-90"
        >
          <Send className="w-6 h-6" />
        </button>
        <button onClick={toggleSave} className="ml-auto transition-transform active:scale-90">
          <Bookmark className={`w-6 h-6 ${post.saved_by_me ? "fill-foreground" : ""}`} />
        </button>
      </div>

      {/* Likes count */}
      <p className="px-3.5 pt-1.5 text-sm font-semibold">{post.likes_count} ta layk</p>

      {/* Comments toggle */}
      {post.comments_count > 0 && !commentsOpen && (
        <button onClick={loadComments} className="px-3.5 pt-1 text-xs text-muted-foreground block">
          Barcha {post.comments_count} ta izohni ko'rish
        </button>
      )}

      <AnimatePresence>
        {commentsOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-3.5 pt-2 space-y-2">
              {loadingComments ? (
                <div className="py-3 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                comments.map((c) => (
                  <p key={c.id} className="text-sm">
                    <span className="font-semibold mr-1.5">{c.author_name}</span>
                    {c.content}
                  </p>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add comment */}
      {user && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 mt-1 border-t border-border/50">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="Izoh qoldiring..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {newComment.trim() && (
            <button onClick={submitComment} disabled={posting} className="text-primary text-sm font-semibold">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yuborish"}
            </button>
          )}
        </div>
      )}

      <p className="px-3.5 pb-3 text-[10px] text-muted-foreground uppercase tracking-wide">{timeAgo(post.created_at)}</p>
    </div>
  );
};
