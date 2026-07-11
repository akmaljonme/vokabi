import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Users,
  Globe,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PostCard, FeedPost } from "@/components/feed/PostCard";
import { FeedLogo } from "@/components/dashboard/DashboardIllustrations";

type PostType = "post" | "reel" | "poll";
type FeedTab = "all" | "following";

const PAGE_SIZE = 10;

const FeedCardSkeleton = () => (
  <div className="rounded-2xl border border-border/60 overflow-hidden">
    <div className="flex items-center gap-2.5 p-3">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
    <Skeleton className="w-full h-64 rounded-none" />
    <div className="p-3.5 space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<FeedTab>("all");
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<PostType>("post");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [posting, setPosting] = useState(false);
  const [deepLinkPost, setDeepLinkPost] = useState<FeedPost | null>(null);
  const [deepLinkLoading, setDeepLinkLoading] = useState(false);

  const enrichPosts = useCallback(
    async (rows: any[]): Promise<FeedPost[]> => {
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

      return rows.map((r) => {
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
    },
    [user],
  );

  // Load who the user follows (needed for the "Kuzatilayotganlar" tab)
  useEffect(() => {
    if (!user) {
      setFollowingIds([]);
      return;
    }
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }: any) => setFollowingIds((data || []).map((r: any) => r.following_id)));
  }, [user]);

  const load = useCallback(
    async (reset: boolean) => {
      if (tab === "following" && followingIds === null) return; // wait for follow list
      if (tab === "following" && followingIds.length === 0) {
        setPosts([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      if (reset) setLoading(true);
      else setLoadingMore(true);

      const from = reset ? 0 : posts.length;
      const to = from + PAGE_SIZE - 1;

      let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).range(from, to);
      if (tab === "following" && followingIds) query = query.in("user_id", followingIds);

      const { data } = await query;
      const rows = (data || []) as any[];
      const enriched = await enrichPosts(rows);

      setPosts((prev) => (reset ? enriched : [...prev, ...enriched]));
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [tab, followingIds, enrichPosts, posts.length],
  );

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, followingIds]);

  // Deep link: ?post=<id> opens that post directly, even if not in the loaded page
  useEffect(() => {
    const postId = searchParams.get("post");
    if (!postId) return;
    setDeepLinkLoading(true);
    supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle()
      .then(async ({ data }: any) => {
        if (data) {
          const [enriched] = await enrichPosts([data]);
          setDeepLinkPost(enriched);
        } else {
          toast.error("Post topilmadi — o'chirilgan bo'lishi mumkin");
        }
        setDeepLinkLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeDeepLink = () => {
    setDeepLinkPost(null);
    searchParams.delete("post");
    setSearchParams(searchParams, { replace: true });
  };

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
      load(true);
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
        <div className="flex items-center justify-between gap-3 mb-4">
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

        {/* Barchasi / Kuzatilayotganlar tabs */}
        {user && (
          <div className="flex gap-1.5 mb-5 p-1 rounded-xl bg-muted/50 w-fit">
            {[
              { key: "all" as const, label: "Barchasi", icon: Globe },
              { key: "following" as const, label: "Kuzatilayotganlar", icon: Users },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  tab === t.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        )}

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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <FeedCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          tab === "following" ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Hali hech kimni kuzatmayapsiz</p>
              <p className="text-sm mt-1 mb-4">Do'stlaringizni kuzating — ularning postlari shu yerda chiqadi</p>
              <Button size="sm" variant="outline" onClick={() => navigate("/friends")}>
                Do'stlarni topish
              </Button>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Hali postlar yo'q</p>
              <p className="text-sm mt-1">Birinchi bo'lib biror narsa joylang!</p>
            </div>
          )
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 5) * 0.03 }}>
                  <PostCard
                    post={post}
                    onChange={(patch) => updatePost(post.id, patch)}
                    onDelete={() => deletePost(post)}
                  />
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-5">
                <Button variant="outline" size="sm" onClick={() => load(false)} disabled={loadingMore}>
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Ko'proq yuklash
                </Button>
              </div>
            )}
          </>
        )}

        {/* Deep-linked shared post */}
        <AnimatePresence>
          {(deepLinkLoading || deepLinkPost) && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 z-[70] backdrop-blur-md"
                onClick={closeDeepLink}
              />
              <div className="fixed inset-0 z-[71] flex items-center justify-center p-3 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
                >
                  {deepLinkLoading ? (
                    <div className="rounded-2xl border border-border/60 bg-card p-10 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : deepLinkPost ? (
                    <PostCard
                      post={deepLinkPost}
                      onChange={(patch) => setDeepLinkPost((p) => (p ? { ...p, ...patch } : p))}
                      onDelete={() => {
                        deletePost(deepLinkPost);
                        closeDeepLink();
                      }}
                    />
                  ) : null}
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </main>
    </AppLayout>
  );
}
