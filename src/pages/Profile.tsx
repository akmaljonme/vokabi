import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Grid3x3,
  Video,
  BarChart3,
  X,
  MessageCircle,
  Settings,
  Flame,
  PlayCircle,
  Bookmark,
  Users,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Trophy,
  Swords,
  PenTool,
  Headphones,
  BookOpen,
  Crown,
  Bell,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { FollowButton } from "@/components/friends/FollowButton";
import { PostCard, FeedPost } from "@/components/feed/PostCard";
import { FeedLogo } from "@/components/dashboard/DashboardIllustrations";

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface SimplePerson {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    try { return document.documentElement.classList.contains("dark"); } catch { return false; }
  });
  const navigate = useNavigate();
  const isMe = user?.id === userId;

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<FeedPost[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [level, setLevel] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [tab, setTab] = useState<"post" | "reel" | "poll" | "saved">("post");
  const [activePost, setActivePost] = useState<FeedPost | null>(null);
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [listPeople, setListPeople] = useState<SimplePerson[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [{ data: profileData }, { data: postsData }, { count: followers }, { count: following }, { data: progress }] =
      await Promise.all([
        supabase.from("profiles").select("user_id, full_name, username, avatar_url, bio").eq("user_id", userId).maybeSingle(),
        supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
        supabase.from("user_progress").select("level, current_streak").eq("user_id", userId).maybeSingle(),
      ]);

    setProfile(profileData || { user_id: userId, full_name: "Foydalanuvchi", username: null, avatar_url: null, bio: null });
    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
    setLevel(progress?.level ?? null);
    setStreak(progress?.current_streak || 0);

    const rows = (postsData || []) as any[];
    const postIds = rows.map((r) => r.id);
    const [{ data: likes }, { data: votes }, { data: saves }, { data: commentCounts }] = await Promise.all([
      postIds.length ? supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
      postIds.length ? supabase.from("poll_votes").select("post_id, user_id, option_index").in("post_id", postIds) : Promise.resolve({ data: [] }),
      postIds.length && user ? supabase.from("post_saves").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
      postIds.length ? supabase.from("post_comments").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
    ]);

    const enriched: FeedPost[] = rows.map((r) => {
      const postLikes = (likes || []).filter((l: any) => l.post_id === r.id);
      const postVotes = (votes || []).filter((v: any) => v.post_id === r.id);
      const tally = (r.poll_options || []).map((_: any, i: number) => postVotes.filter((v: any) => v.option_index === i).length);
      return {
        ...r,
        author_name: profileData?.full_name || "Foydalanuvchi",
        author_avatar: profileData?.avatar_url || null,
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
  }, [userId, user]);

  const loadSaved = useCallback(async () => {
    if (!user || !isMe) return;
    setSavedLoading(true);
    const { data: saveRows } = await supabase
      .from("post_saves")
      .select("post_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const postIds = (saveRows || []).map((s: any) => s.post_id);
    if (postIds.length === 0) {
      setSavedPosts([]);
      setSavedLoading(false);
      return;
    }

    const { data: postsData } = await supabase.from("posts").select("*").in("id", postIds);
    const rows = (postsData || []) as any[];
    // saqlangan tartibida (eng yangi saqlangani birinchi)
    rows.sort((a, b) => postIds.indexOf(a.id) - postIds.indexOf(b.id));

    const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const [{ data: profiles }, { data: likes }, { data: votes }, { data: commentCounts }] = await Promise.all([
      authorIds.length ? supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds) : Promise.resolve({ data: [] }),
      supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds),
      supabase.from("poll_votes").select("post_id, user_id, option_index").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
    ]);

    const enriched: FeedPost[] = rows.map((r) => {
      const postLikes = (likes || []).filter((l: any) => l.post_id === r.id);
      const postVotes = (votes || []).filter((v: any) => v.post_id === r.id);
      const tally = (r.poll_options || []).map((_: any, i: number) => postVotes.filter((v: any) => v.option_index === i).length);
      const author = profiles?.find((p: any) => p.user_id === r.user_id);
      return {
        ...r,
        author_name: author?.full_name || "Foydalanuvchi",
        author_avatar: author?.avatar_url || null,
        likes_count: postLikes.length,
        liked_by_me: postLikes.some((l: any) => l.user_id === user.id),
        saved_by_me: true,
        comments_count: (commentCounts || []).filter((c: any) => c.post_id === r.id).length,
        poll_tally: tally,
        my_vote: postVotes.find((v: any) => v.user_id === user.id)?.option_index ?? null,
      };
    });
    setSavedPosts(enriched);
    setSavedLoading(false);
  }, [user, isMe]);

  useEffect(() => {
    if (tab === "saved" && savedPosts === null) loadSaved();
  }, [tab, savedPosts, loadSaved]);

  useEffect(() => {
    load();
  }, [load]);

  const openList = async (kind: "followers" | "following") => {
    setListModal(kind);
    setListLoading(true);
    const { data } = await supabase
      .from("follows")
      .select(kind === "followers" ? "follower_id" : "following_id")
      .eq(kind === "followers" ? "following_id" : "follower_id", userId);
    const ids = (data || []).map((r: any) => (kind === "followers" ? r.follower_id : r.following_id));
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
      setListPeople(profs || []);
    } else {
      setListPeople([]);
    }
    setListLoading(false);
  };

  const filteredPosts = tab === "saved" ? savedPosts || [] : posts.filter((p) => p.type === tab);
  const isSavedTabLoading = tab === "saved" && savedLoading && savedPosts === null;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-display font-black truncate">
            {profile?.username ? `@${profile.username}` : profile?.full_name}
          </h1>
        </div>

        {/* Header */}
        <div className="flex items-start gap-5 mb-5">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 ring-2 ring-border/60">
            {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover rounded-full" />}
            <AvatarFallback className="text-2xl">{profile?.full_name?.[0] || "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <button onClick={() => openList("followers")} className="text-center">
                <p className="font-display font-bold text-base leading-none">{posts.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Postlar</p>
              </button>
              <button onClick={() => openList("followers")} className="text-center">
                <p className="font-display font-bold text-base leading-none">{followersCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Followerlar</p>
              </button>
              <button onClick={() => openList("following")} className="text-center">
                <p className="font-display font-bold text-base leading-none">{followingCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Kuzatilmoqda</p>
              </button>
              {level !== null && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  Daraja {level}
                </span>
              )}
              {streak > 0 && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {streak}
                </span>
              )}
            </div>

            {isMe ? (
              <Button size="sm" variant="outline" onClick={() => navigate("/profile")}>
                <Settings className="w-3.5 h-3.5 mr-1.5" /> Profilni tahrirlash
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <FollowButton targetUserId={userId!} targetName={profile?.full_name || undefined} size="default" />
                <Button size="sm" variant="outline" onClick={() => navigate(`/community?dm=${userId}`)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Xabar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="font-semibold text-sm">{profile?.full_name}</p>
          {profile?.bio && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">{profile.bio}</p>}
        </div>

        {/* Mobile-only hub: Feed/Reels/Community/Notifications + full menu.
            Desktop foydalanuvchilari buni Sidebar orqali oladi. */}
        {isMe && (
          <div className="lg:hidden mb-6 space-y-5">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Feed", icon: FeedLogo, path: "/feed", color: "" },
                { label: "Reels", icon: Video, path: "/reels", color: "text-rose-500" },
                { label: "Jamiyat", icon: Users, path: "/community", color: "text-blue-500" },
                { label: "Xabar", icon: Bell, path: "/notifications", color: "text-amber-500" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border/60 divide-y divide-border/50 overflow-hidden">
              {[
                { label: "Statistika", icon: BarChart3, path: "/dashboard" },
                { label: "Yutuqlar", icon: Trophy, path: "/dashboard" },
                { label: "Do'stlar", icon: Users, path: "/friends" },
                { label: "Turnirlar", icon: Swords, path: "/tournaments" },
                { label: "Grammatika", icon: PenTool, path: "/grammar" },
                { label: "Listening", icon: Headphones, path: "/listening" },
                { label: "So'z Banki", icon: BookOpen, path: "/wordbank" },
                { label: "Pro rejaga o'tish", icon: Crown, path: "/pricing" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border/60 divide-y divide-border/50 overflow-hidden">
              <button
                onClick={() => {
                  const next = !isDark;
                  document.documentElement.classList.toggle("dark", next);
                  localStorage.setItem("theme", next ? "dark" : "light");
                  setIsDark(next);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-muted-foreground shrink-0" />}
                <span className="text-sm font-medium flex-1">{isDark ? "Light mode" : "Dark mode"}</span>
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium flex-1">Sozlamalar</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </button>
              <a
                href="/#faq"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium flex-1">Yordam</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </a>
            </div>

            <button
              onClick={async () => { await signOut(); navigate("/"); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/40 text-destructive font-bold text-sm tracking-wide hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> CHIQISH
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-t border-border/60">
          {[
            { key: "post" as const, icon: Grid3x3, label: "Postlar" },
            { key: "reel" as const, icon: Video, label: "Reels" },
            { key: "poll" as const, icon: BarChart3, label: "So'rovnomalar" },
            ...(isMe ? [{ key: "saved" as const, icon: Bookmark, label: "Saqlangan" }] : []),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium border-t-2 -mt-px transition-colors ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isSavedTabLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {tab === "saved" ? (
              <>
                <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Hali hech narsa saqlanmagan</p>
                <p className="text-xs mt-1">Feed'da postlarni 🔖 bosib saqlang</p>
              </>
            ) : (
              <>
                <Grid3x3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Hali hech narsa yo'q</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => (post.type === "reel" ? navigate(`/reels?start=${post.id}`) : setActivePost(post))}
                className="relative aspect-square bg-muted overflow-hidden group"
              >
                {post.media_url ? (
                  post.media_type === "video" ? (
                    <>
                      <video src={post.media_url} className="w-full h-full object-cover" muted />
                      <PlayCircle className="absolute top-1.5 right-1.5 w-4 h-4 text-white drop-shadow" />
                    </>
                  ) : (
                    <img src={post.media_url} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center text-[10px] font-medium bg-primary/5">
                    {post.caption?.slice(0, 60) || (post.type === "poll" ? "📊 So'rovnoma" : "📝")}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Post lightbox */}
        <AnimatePresence>
          {activePost && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 z-[70] backdrop-blur-md"
                onClick={() => setActivePost(null)}
              />
              <div className="fixed inset-0 z-[71] flex items-center justify-center p-3 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
                >
                  <PostCard
                    post={activePost}
                    hideFollow={tab !== "saved"}
                    onChange={(patch) => {
                      setActivePost((p) => (p ? { ...p, ...patch } : p));
                      setPosts((prev) => prev.map((p) => (p.id === activePost.id ? { ...p, ...patch } : p)));
                      setSavedPosts((prev) =>
                        prev ? prev.map((p) => (p.id === activePost.id ? { ...p, ...patch } : p)) : prev,
                      );
                    }}
                    onDelete={() => {
                      setPosts((prev) => prev.filter((p) => p.id !== activePost.id));
                      setSavedPosts((prev) => (prev ? prev.filter((p) => p.id !== activePost.id) : prev));
                      setActivePost(null);
                      supabase.from("posts").delete().eq("id", activePost.id);
                    }}
                  />
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Followers/Following list modal */}
        <AnimatePresence>
          {listModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 z-[70] backdrop-blur-md"
                onClick={() => setListModal(null)}
              />
              <div className="fixed inset-0 z-[71] flex items-center justify-center p-3 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-xs max-h-[70vh] overflow-y-auto pointer-events-auto rounded-2xl border border-border/60 bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">
                      {listModal === "followers" ? "Followerlar" : "Kuzatilayotganlar"}
                    </h3>
                    <button onClick={() => setListModal(null)}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  {listLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : listPeople.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Hozircha bo'sh</p>
                  ) : (
                    <div className="space-y-1">
                      {listPeople.map((p) => (
                        <button
                          key={p.user_id}
                          onClick={() => {
                            setListModal(null);
                            navigate(`/u/${p.user_id}`);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/60 transition-colors"
                        >
                          <Avatar className="w-8 h-8">
                            {p.avatar_url && <img src={p.avatar_url} className="w-full h-full object-cover rounded-full" />}
                            <AvatarFallback>{p.full_name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{p.full_name || "Foydalanuvchi"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </main>
    </AppLayout>
  );
}
