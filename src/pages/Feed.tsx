import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  BarChart3,
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
import { PostCard, FeedPost } from "@/components/feed/PostCard";
import { FeedLogo } from "@/components/dashboard/DashboardIllustrations";

type PostType = "post" | "reel" | "poll";

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<FeedPost[]>([]);
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

    const [{ data: profiles }, { data: likes }, { data: votes }, { data: saves }, { data: commentCounts }] = await Promise.all([
      authorIds.length
        ? supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds)
        : Promise.resolve({ data: [] }),
      postIds.length
        ? supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
        : Promise.resolve({ data: [] }),
      postIds.length
        ? supabase.from("poll_votes").select("post_id, user_id, option_index").in("post_id", postIds)
        : Promise.resolve({ data: [] }),
      postIds.length && user
        ? supabase.from("post_saves").select("post_id").eq("user_id", user.id).in("post_id", postIds)
        : Promise.resolve({ data: [] }),
      postIds.length
        ? supabase.from("post_comments").select("post_id").in("post_id", postIds)
        : Promise.resolve({ data: [] }),
    ]);

    const enriched: FeedPost[] = rows.map((r) => {
      const postLikes = (likes || []).filter((l: any) => l.post_id === r.id);
      const postVotes = (votes || []).filter((v: any) => v.post_id === r.id);
      const tally = (r.poll_options || []).map(
        (_: any, i: number) => postVotes.filter((v: any) => v.option_index === i).length,
      );
      const profile = profiles?.find((p: any) => p.user_id === r.user_id);
      return {
        ...r,
        author_name: profile?.full_name || "Foydalanuvchi",
        author_avatar: profile?.avatar_url || null,
        likes_count: postLikes.length,
        liked_by_me: postLikes.some((l: any) => l.user_id === user?.id),
        saved_by_me: (saves || []).some((s: any) => s.post_id === r.id),
        comments_count: (commentCounts || []).filter((c: any) => c.post_id === r.id).length,
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

  const deletePost = async (post: FeedPost) => {
    if (!user || post.user_id !== user.id) return;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    await supabase.from("posts").delete().eq("id", post.id);
  };

  const updatePost = (id: string, patch: Partial<FeedPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-display font-black flex items-center gap-2">
              <FeedLogo className="w-8 h-8" /> Feed
            </h1>
          </div>
          {user && (
            <button onClick={() => navigate(`/u/${user.id}`)} className="text-xs text-primary font-medium">
              Mening profilim
            </button>
          )}
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
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <PostCard
                  post={post}
                  onChange={(patch) => updatePost(post.id, patch)}
                  onDelete={() => deletePost(post)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
