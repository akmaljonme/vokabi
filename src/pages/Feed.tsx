import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  BarChart3,
  Heart,
  Loader2,
  X,
  Plus,
  Trash2,
  Send,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FollowButton } from "@/components/friends/FollowButton";

type PostType = "post" | "reel" | "poll";

interface PostRow {
  id: string;
  user_id: string;
  type: PostType;
  caption: string | null;
  media_url: string | null;
  media_type: "image" | "video" | null;
  poll_options: { text: string }[] | null;
  created_at: string;
  author_name?: string;
  likes_count: number;
  liked_by_me: boolean;
  poll_tally: number[];
  my_vote: number | null;
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

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<PostType>("post");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    const rows = (data || []) as any[];

    const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const postIds = rows.map((r) => r.id);

    const [{ data: profiles }, { data: likes }, { data: votes }] = await Promise.all([
      authorIds.length
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", authorIds)
        : Promise.resolve({ data: [] }),
      postIds.length
        ? supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
        : Promise.resolve({ data: [] }),
      postIds.length
        ? supabase.from("poll_votes").select("post_id, user_id, option_index").in("post_id", postIds)
        : Promise.resolve({ data: [] }),
    ]);

    const enriched: PostRow[] = rows.map((r) => {
      const postLikes = (likes || []).filter((l: any) => l.post_id === r.id);
      const postVotes = (votes || []).filter((v: any) => v.post_id === r.id);
      const tally = (r.poll_options || []).map(
        (_: any, i: number) => postVotes.filter((v: any) => v.option_index === i).length,
      );
      return {
        ...r,
        author_name: profiles?.find((p: any) => p.user_id === r.user_id)?.full_name || "Foydalanuvchi",
        likes_count: postLikes.length,
        liked_by_me: postLikes.some((l: any) => l.user_id === user?.id),
        poll_tally: tally,
        my_vote: postVotes.find((v: any) => v.user_id === user?.id)?.option_index ?? null,
      };
    });
    setPosts(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFileSelect = (f: File | null) => {
    setFile(f);
    if (f) setFilePreview(URL.createObjectURL(f));
    else setFilePreview(null);
  };

  const resetComposer = () => {
    setCaption("");
    handleFileSelect(null);
    setPollOptions(["", ""]);
    setComposerOpen(false);
  };

  const submitPost = async () => {
    if (!user) return;
    if (composerType === "poll") {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!caption.trim() || opts.length < 2) {
        toast.error("Savol va kamida 2 ta variant kiriting");
        return;
      }
    } else if (!file && !caption.trim()) {
      toast.error("Rasm/video yoki matn qo'shing");
      return;
    }

    setPosting(true);
    try {
      let media_url: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (file) {
        media_type = composerType === "reel" || file.type.startsWith("video") ? "video" : "image";
        const ext = file.name.split(".").pop() || "bin";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("posts-media")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (upErr) throw new Error(`Fayl yuklashda xato: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("posts-media").getPublicUrl(path);
        media_url = pub.publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        type: composerType,
        caption: caption.trim() || null,
        media_url,
        media_type,
        poll_options:
          composerType === "poll"
            ? pollOptions.filter((o) => o.trim()).map((o) => ({ text: o.trim() }))
            : null,
      });
      if (error) throw new Error(`Post saqlashda xato: ${error.message}`);

      toast.success("Joylandi! 🎉");
      resetComposer();
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Joylashda xatolik yuz berdi");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: PostRow) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.likes_count + (p.liked_by_me ? -1 : 1) }
          : p,
      ),
    );
    if (post.liked_by_me) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    }
  };

  const vote = async (post: PostRow, optionIndex: number) => {
    if (!user || post.my_vote !== null) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              my_vote: optionIndex,
              poll_tally: p.poll_tally.map((c, i) => (i === optionIndex ? c + 1 : c)),
            }
          : p,
      ),
    );
    await supabase.from("poll_votes").insert({ post_id: post.id, user_id: user.id, option_index: optionIndex });
  };

  const deletePost = async (post: PostRow) => {
    if (!user || post.user_id !== user.id) return;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    await supabase.from("posts").delete().eq("id", post.id);
  };

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-black">Feed</h1>
        </div>

        {/* Composer trigger */}
        {!composerOpen ? (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl border border-border/60">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback>{(user?.email || "?")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => setComposerOpen(true)}
              className="flex-1 text-left text-sm text-muted-foreground px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              Nima haqida gaplashamiz?
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl border border-border/60"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {[
                  { key: "post" as const, label: "Post", icon: ImageIcon },
                  { key: "reel" as const, label: "Reel", icon: Video },
                  { key: "poll" as const, label: "So'rovnoma", icon: BarChart3 },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setComposerType(t.key);
                      handleFileSelect(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      composerType === t.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>
              <button onClick={resetComposer} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={composerType === "poll" ? "Savolingizni yozing..." : "Nima haqida gaplashamiz?"}
              className="mb-3 resize-none"
              rows={3}
            />

            {composerType === "poll" ? (
              <div className="space-y-2 mb-3">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) =>
                        setPollOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                      }
                      placeholder={`Variant ${i + 1}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-border/60 bg-transparent text-sm outline-none focus:border-primary/50"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={() => setPollOptions((prev) => [...prev, ""])}
                    className="text-xs text-primary font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Variant qo'shish
                  </button>
                )}
              </div>
            ) : (
              <div className="mb-3">
                {filePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    {composerType === "reel" || file?.type.startsWith("video") ? (
                      <video src={filePreview} className="w-full max-h-72 object-cover" controls />
                    ) : (
                      <img src={filePreview} className="w-full max-h-72 object-cover" />
                    )}
                    <button
                      onClick={() => handleFileSelect(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 rounded-xl border-2 border-dashed border-border/60 text-sm text-muted-foreground hover:border-primary/40 transition-colors flex flex-col items-center gap-1.5"
                  >
                    {composerType === "reel" ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    {composerType === "reel" ? "Video yuklash" : "Rasm yuklash (ixtiyoriy)"}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={composerType === "reel" ? "video/*" : "image/*"}
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
              </div>
            )}

            <Button className="w-full" onClick={submitPost} disabled={posting}>
              {posting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Joylash
            </Button>
          </motion.div>
        )}

        {/* Feed list */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Hali postlar yo'q</p>
            <p className="text-sm mt-1">Birinchi bo'lib biror narsa joylang!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-border/60 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 p-3.5">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback>{post.author_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{post.author_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {timeAgo(post.created_at)} · {post.type === "reel" ? "🎬 Reel" : post.type === "poll" ? "📊 So'rovnoma" : "📝 Post"}
                    </p>
                  </div>
                  <FollowButton targetUserId={post.user_id} targetName={post.author_name} />
                  {post.user_id === user?.id && (
                    <button onClick={() => deletePost(post)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {post.caption && (
                  <p className="px-3.5 pb-3 text-sm whitespace-pre-wrap">{post.caption}</p>
                )}

                {post.media_url && post.media_type === "video" && (
                  <video src={post.media_url} className="w-full max-h-[480px] object-cover bg-black" controls />
                )}
                {post.media_url && post.media_type === "image" && (
                  <img src={post.media_url} className="w-full max-h-[480px] object-cover" />
                )}

                {post.type === "poll" && post.poll_options && (
                  <div className="px-3.5 pb-3.5 space-y-2">
                    {post.poll_options.map((opt, idx) => {
                      const total = post.poll_tally.reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((post.poll_tally[idx] / total) * 100) : 0;
                      const voted = post.my_vote !== null;
                      const isMine = post.my_vote === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => vote(post, idx)}
                          disabled={voted}
                          className={`w-full relative overflow-hidden rounded-xl border text-left p-2.5 text-sm transition-colors ${
                            isMine ? "border-primary" : "border-border/60"
                          } ${voted ? "cursor-default" : "hover:bg-muted/50"}`}
                        >
                          {voted && (
                            <div
                              className="absolute inset-y-0 left-0 bg-primary/10"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <span className={isMine ? "font-semibold" : ""}>{opt.text}</span>
                            {voted && <span className="text-xs text-muted-foreground">{pct}%</span>}
                          </div>
                        </button>
                      );
                    })}
                    <p className="text-[11px] text-muted-foreground">
                      {post.poll_tally.reduce((a, b) => a + b, 0)} ta ovoz
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 px-3.5 pb-3.5 pt-1">
                  <button
                    onClick={() => toggleLike(post)}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      post.liked_by_me ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-red-500" : ""}`} />
                    {post.likes_count}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
