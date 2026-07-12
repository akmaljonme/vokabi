import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { StoryViewer, StoryGroup } from "./StoryViewer";

export const StoriesBar = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [viewerOpenAt, setViewerOpenAt] = useState<number | null>(null);

  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    const { data: myViews } = await supabase.from("story_views").select("story_id").eq("viewer_id", user.id);
    const viewedSet = new Set<string>((myViews || []).map((v: any) => v.story_id));
    setViewedIds(viewedSet);

    const authorIds = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
    const { data: profiles } = authorIds.length
      ? await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds)
      : { data: [] };

    setMyAvatar(profiles?.find((p: any) => p.user_id === user.id)?.avatar_url || null);

    const byUser = new Map<string, StoryGroup>();
    (rows || []).forEach((r: any) => {
      const profile = profiles?.find((p: any) => p.user_id === r.user_id);
      if (!byUser.has(r.user_id)) {
        byUser.set(r.user_id, {
          user_id: r.user_id,
          author_name: profile?.full_name || "Foydalanuvchi",
          author_avatar: profile?.avatar_url || null,
          stories: [],
        });
      }
      byUser.get(r.user_id)!.stories.push({
        id: r.id,
        user_id: r.user_id,
        media_url: r.media_url,
        media_type: r.media_type,
        caption: r.caption,
        created_at: r.created_at,
      });
    });

    // O'zim birinchi, keyin o'qilmagan storylar, keyin o'qilganlar
    const list = Array.from(byUser.values());
    list.sort((a, b) => {
      if (a.user_id === user.id) return -1;
      if (b.user_id === user.id) return 1;
      const aUnseen = a.stories.some((s) => !viewedSet.has(s.id));
      const bUnseen = b.stories.some((s) => !viewedSet.has(s.id));
      if (aUnseen !== bUnseen) return aUnseen ? -1 : 1;
      return 0;
    });
    setGroups(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const myGroupIndex = groups.findIndex((g) => g.user_id === user?.id);

  const handleFileSelect = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submitStory = async () => {
    if (!user || !file) return;
    setUploading(true);
    try {
      const media_type = file.type.startsWith("video") ? "video" : "image";
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/story-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("posts-media")
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw new Error(`Fayl yuklashda xato: ${upErr.message}`);
      const { data: pub } = supabase.storage.from("posts-media").getPublicUrl(path);

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        media_url: pub.publicUrl,
        media_type,
        caption: caption.trim() || null,
      });
      if (error) throw new Error(`Story saqlashda xato: ${error.message}`);

      toast.success("Story qo'shildi! 24 soat davomida ko'rinadi");
      setUploaderOpen(false);
      setCaption("");
      handleFileSelect(null);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Story yuklanmadi");
    } finally {
      setUploading(false);
    }
  };

  const handleStoryDeleted = (storyId: string) => {
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, stories: g.stories.filter((s) => s.id !== storyId) }))
        .filter((g) => g.stories.length > 0),
    );
  };

  if (loading) return null;

  return (
    <div className="mb-6">
      <div className="flex gap-3.5 overflow-x-auto pb-1 -mx-1 px-1">
        {/* Add story */}
        <button onClick={() => setUploaderOpen(true)} className="shrink-0 flex flex-col items-center gap-1.5 w-16">
          <div className="relative">
            <Avatar className="w-14 h-14">
              {myAvatar && <AvatarImage src={myAvatar} />}
              <AvatarFallback>{(user?.email || "?")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-2 ring-background">
              <Plus className="w-3 h-3" />
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">Story qo'shish</span>
        </button>

        {groups
          .filter((g) => g.user_id !== user?.id)
          .map((g) => {
            const hasUnseen = g.stories.some((s) => !viewedIds.has(s.id));
            const idx = groups.findIndex((x) => x.user_id === g.user_id);
            return (
              <button
                key={g.user_id}
                onClick={() => setViewerOpenAt(idx)}
                className="shrink-0 flex flex-col items-center gap-1.5 w-16"
              >
                <div
                  className={`p-0.5 rounded-full ${
                    hasUnseen ? "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-500" : "bg-muted"
                  }`}
                >
                  <Avatar className="w-14 h-14 ring-2 ring-background">
                    {g.author_avatar && <AvatarImage src={g.author_avatar} />}
                    <AvatarFallback>{g.author_name[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[10px] truncate w-full text-center">{g.author_name}</span>
              </button>
            );
          })}

        {/* O'zimning storyimga ham qayta kirish (agar bor bo'lsa) */}
        {myGroupIndex >= 0 && groups[myGroupIndex].stories.length > 0 && (
          <button
            onClick={() => setViewerOpenAt(myGroupIndex)}
            className="shrink-0 flex flex-col items-center gap-1.5 w-16"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-500">
              <Avatar className="w-14 h-14 ring-2 ring-background">
                {myAvatar && <AvatarImage src={myAvatar} />}
                <AvatarFallback>{(user?.email || "?")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">Mening story'im</span>
          </button>
        )}
      </div>

      {viewerOpenAt !== null && (
        <StoryViewer
          groups={groups}
          startGroupIndex={viewerOpenAt}
          onClose={() => {
            setViewerOpenAt(null);
            load();
          }}
          onDeleted={handleStoryDeleted}
        />
      )}

      {/* Uploader modal */}
      {uploaderOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-3">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md" onClick={() => setUploaderOpen(false)} />
          <div className="relative w-full max-w-sm rounded-3xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm">Yangi story</p>
              <button onClick={() => setUploaderOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {preview ? (
              <div className="relative rounded-xl overflow-hidden mb-3 aspect-[9/16] bg-black">
                {file?.type.startsWith("video") ? (
                  <video src={preview} className="w-full h-full object-contain" controls />
                ) : (
                  <img src={preview} className="w-full h-full object-contain" />
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
                className="w-full py-10 rounded-xl border-2 border-dashed border-border/60 text-sm text-muted-foreground hover:border-primary/40 transition-colors mb-3"
              >
                Rasm yoki video tanlang
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />

            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 150))}
              placeholder="Matn qo'shish (ixtiyoriy)"
              className="mb-3 resize-none"
              rows={2}
            />

            <Button className="w-full" onClick={submitStory} disabled={!file || uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Story sifatida joylash
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
