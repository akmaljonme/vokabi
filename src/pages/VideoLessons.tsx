import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Play, Clock, BookOpen, Headphones, Pen, Mic, BookOpenCheck, Languages, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoLesson {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string | null;
  skill: string;
  level: string;
  duration: string | null;
  order_index: number;
}

const skillConfig: Record<string, {label: string;icon: any;color: string;}> = {
  all: { label: 'Barchasi', icon: Video, color: 'text-primary' },
  reading: { label: 'Reading', icon: BookOpen, color: 'text-blue-500' },
  listening: { label: 'Listening', icon: Headphones, color: 'text-purple-500' },
  writing: { label: 'Writing', icon: Pen, color: 'text-emerald-500' },
  speaking: { label: 'Speaking', icon: Mic, color: 'text-orange-500' },
  grammar: { label: 'Grammar', icon: BookOpenCheck, color: 'text-rose-500' },
  vocabulary: { label: "Lug'at", icon: Languages, color: 'text-amber-500' }
};

export default function VideoLessons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSkill, setActiveSkill] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await (supabase.from('video_lessons') as any).
      select('*').eq('is_active', true).order('order_index', { ascending: true });
      if (data) setVideos(data);
      setLoading(false);
    };
    fetchVideos();
  }, []);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (activeSkill !== 'all' && v.skill !== activeSkill) return false;
      if (filterLevel !== 'all' && v.level !== filterLevel) return false;
      if (searchQuery && !v.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [videos, activeSkill, filterLevel, searchQuery]);

  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = { all: videos.length };
    videos.forEach((v) => {counts[v.skill] = (counts[v.skill] || 0) + 1;});
    return counts;
  }, [videos]);

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Video Darslar 
Eslatma : Ibrat Farzandlari tomonidan ruxsat olingan      
 </h1>
            <p className="text-sm text-muted-foreground">{videos.length} ta dars mavjud</p>
          </div>
        </motion.div>

        {/* Skill Tabs */}
        <Tabs value={activeSkill} onValueChange={setActiveSkill} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {Object.entries(skillConfig).map(([key, cfg]) => {const Icon = cfg.icon;return (
                <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                  <Icon className={`w-3.5 h-3.5 ${activeSkill === key ? '' : cfg.color}`} />
                  {cfg.label}
                  {skillCounts[key] ? <span className="text-[10px] opacity-60">({skillCounts[key]})</span> : null}
                </TabsTrigger>);

            })}
          </TabsList>
        </Tabs>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Video qidirish..." className="pl-9" />
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Daraja" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Video Grid */}
        {loading ?
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          </div> :
        filtered.length === 0 ?
        <div className="text-center py-20 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Video topilmadi</p>
            <p className="text-sm mt-1">Boshqa filtr yoki kalit so'z bilan sinab ko'ring</p>
          </div> :

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((video, i) => {
              const cfg = skillConfig[video.skill] || skillConfig.grammar;
              const isPlaying = playingVideoId === video.id;

              return (
                <motion.div
                  key={video.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}>
                  
                    <Card className="border-border/50 overflow-hidden group hover:shadow-lg hover:border-primary/20 transition-all">
                      {isPlaying ?
                    <div className="aspect-video">
                          <iframe
                        src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen />
                      
                        </div> :

                    <div
                      className="relative aspect-video cursor-pointer"
                      onClick={() => setPlayingVideoId(video.id)}>
                      
                          {video.youtube_id ?
                      <img
                        src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy" /> :


                      <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Video className="w-10 h-10 text-muted-foreground" />
                            </div>
                      }
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                            </div>
                          </div>
                          {video.duration &&
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[11px] text-white flex items-center gap-1">
                              <Clock className="w-3 h-3" />{video.duration}
                            </span>
                      }
                        </div>
                    }
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{video.title}</h3>
                        {video.description &&
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{video.description}</p>
                      }
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{video.level}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>);

            })}
            </AnimatePresence>
          </div>
        }
      </main>
    </AppLayout>);

}