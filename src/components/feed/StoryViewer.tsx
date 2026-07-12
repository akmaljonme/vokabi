import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Eye, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";

export interface StoryItem {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
}

export interface StoryGroup {
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  stories: StoryItem[];
}

interface Viewer {
  viewer_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const IMAGE_DURATION = 5000;

interface Props {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
  onDeleted?: (storyId: string) => void;
}

export const StoryViewer = ({ groups, startGroupIndex, onClose, onDeleted }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<Viewer[] | null>(null);

  const rafRef = useRef<number>();
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isMine = story?.user_id === user?.id;

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [group, storyIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  }, [storyIndex, groupIndex, groups]);

  // Progress animatsiyasi
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    setViewersOpen(false);
    setViewers(null);

    const duration = story?.media_type === "video" ? null : IMAGE_DURATION;

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      if (paused) {
        startRef.current = now - elapsedRef.current;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startRef.current;
      elapsedRef.current = elapsed;
      const d = duration || (videoRef.current?.duration ? videoRef.current.duration * 1000 : IMAGE_DURATION);
      const pct = Math.min(100, (elapsed / d) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    startRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    if (videoRef.current) {
      if (paused) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [paused, story]);

  // Ko'rish belgisini qo'yish
  useEffect(() => {
    if (!user || !story || isMine) return;
    supabase.from("story_views").insert({ story_id: story.id, viewer_id: user.id }).then(() => {});
  }, [story, user, isMine]);

  const deleteStory = async () => {
    if (!story) return;
    await supabase.from("stories").delete().eq("id", story.id);
    onDeleted?.(story.id);
    goNext();
  };

  const openViewers = async () => {
    if (!story) return;
    setViewersOpen(true);
    setPaused(true);
    const { data } = await supabase.from("story_views").select("viewer_id").eq("story_id", story.id);
    const ids = (data || []).map((v: any) => v.viewer_id);
    if (ids.length === 0) {
      setViewers([]);
      return;
    }
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
    setViewers(
      (profiles || []).map((p: any) => ({ viewer_id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url })),
    );
  };

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 bg-black z-[95] flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
        {group.stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${i < storyIndex ? 100 : i === storyIndex ? progress : 0}%` }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-7 left-3 right-3 z-10 flex items-center justify-between">
        <button onClick={() => navigate(`/u/${group.user_id}`)} className="flex items-center gap-2">
          <Avatar className="w-8 h-8 ring-1 ring-white/40">
            {group.author_avatar && <AvatarImage src={group.author_avatar} />}
            <AvatarFallback>{group.author_name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-semibold">{group.author_name}</span>
        </button>
        <div className="flex items-center gap-3">
          {isMine && (
            <button onClick={deleteStory} className="text-white">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div
        className="relative h-full w-full max-w-md mx-auto flex items-center justify-center"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {story.media_type === "video" ? (
          <video
            ref={videoRef}
            src={story.media_url}
            className="max-h-full max-w-full object-contain"
            playsInline
            muted
            autoPlay
          />
        ) : (
          <img src={story.media_url} className="max-h-full max-w-full object-contain" />
        )}

        {story.caption && (
          <p className="absolute bottom-20 left-4 right-4 text-white text-sm text-center bg-black/30 rounded-xl p-2.5">
            {story.caption}
          </p>
        )}

        {/* Tap zones */}
        <button onClick={goPrev} className="absolute left-0 top-0 h-full w-1/3" aria-label="Oldingi" />
        <button onClick={goNext} className="absolute right-0 top-0 h-full w-1/3" aria-label="Keyingi" />

        {/* Desktop chevrons */}
        <button
          onClick={goPrev}
          className="hidden sm:flex absolute -left-12 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 items-center justify-center text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="hidden sm:flex absolute -right-12 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 items-center justify-center text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {isMine && (
        <button
          onClick={openViewers}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-white text-xs bg-white/10 px-3 py-1.5 rounded-full"
        >
          <Eye className="w-3.5 h-3.5" /> Ko'rganlar
        </button>
      )}

      {/* Viewers bottom sheet */}
      <AnimatePresence>
        {viewersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[96]"
              onClick={() => {
                setViewersOpen(false);
                setPaused(false);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[97] bg-background rounded-t-3xl max-h-[60vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> {viewers?.length ?? "..."} ko'rgan
                </p>
                <button
                  onClick={() => {
                    setViewersOpen(false);
                    setPaused(false);
                  }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {viewers === null ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : viewers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Hali hech kim ko'rmagan</p>
                ) : (
                  <div className="space-y-1">
                    {viewers.map((v) => (
                      <div key={v.viewer_id} className="flex items-center gap-2.5 p-2 rounded-xl">
                        <Avatar className="w-8 h-8">
                          {v.avatar_url && <AvatarImage src={v.avatar_url} />}
                          <AvatarFallback>{v.full_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{v.full_name || "Foydalanuvchi"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
