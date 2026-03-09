import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Play, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoLesson {
  id: string;
  title: string;
  youtube_id: string | null;
  skill: string;
  level: string;
  duration: string | null;
}

interface Props {
  weakSkills: string[];
}

export const VideoRecommendations = ({ weakSkills }: Props) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (weakSkills.length === 0) {
        // Just show latest videos
        const { data } = await (supabase.from('video_lessons') as any)
          .select('id, title, youtube_id, skill, level, duration')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4);
        if (data) setVideos(data);
      } else {
        // Fetch videos matching weak skills
        const { data } = await (supabase.from('video_lessons') as any)
          .select('id, title, youtube_id, skill, level, duration')
          .eq('is_active', true)
          .in('skill', weakSkills)
          .order('order_index', { ascending: true })
          .limit(4);
        if (data) setVideos(data);
      }
      setLoading(false);
    };
    fetch();
  }, [weakSkills]);

  if (loading || videos.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5">
              <Sparkles className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <CardTitle className="text-base">Tavsiya etilgan videolar</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {weakSkills.length > 0 ? "Zaif ko'nikmalaringizga mos" : "Eng so'nggi videolar"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/videos')} className="text-xs gap-1">
            Barchasi <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {videos.map((video, i) => (
            <motion.a
              key={video.id}
              href={`https://youtube.com/watch?v=${video.youtube_id}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                {video.youtube_id ? (
                  <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center"><Video className="w-6 h-6 text-muted-foreground" /></div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-xs font-semibold line-clamp-2">{video.title}</p>
              <div className="flex gap-1 mt-1">
                <Badge variant="outline" className="text-[9px]">{video.skill}</Badge>
                <Badge variant="secondary" className="text-[9px]">{video.level}</Badge>
              </div>
            </motion.a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
