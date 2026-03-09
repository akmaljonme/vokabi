import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Video, ExternalLink, Search, ListVideo, Loader2, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

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
  is_active: boolean;
  created_at: string;
}

const SKILLS = [
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocabulary', label: 'Vocabulary' },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

export const VideoLessonsTab = () => {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLesson | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Playlist import state
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistSkill, setPlaylistSkill] = useState('grammar');
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [parsedVideos, setParsedVideos] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', youtube_url: '', skill: 'grammar',
    level: 'A1', duration: '', order_index: 0, is_active: true,
  });

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('video_lessons') as any)
      .select('*').order('order_index', { ascending: true });
    if (!error && data) setVideos(data);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', youtube_url: '', skill: 'grammar', level: 'A1', duration: '', order_index: videos.length, is_active: true });
    setEditingVideo(null);
  };

  const openEditDialog = (video: VideoLesson) => {
    setEditingVideo(video);
    setForm({
      title: video.title, description: video.description || '', youtube_url: video.youtube_url,
      skill: video.skill, level: video.level, duration: video.duration || '',
      order_index: video.order_index, is_active: video.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.youtube_url.trim()) {
      toast.error("Sarlavha va YouTube URL kerak");
      return;
    }
    const youtube_id = extractYouTubeId(form.youtube_url);
    const payload = { ...form, youtube_id, thumbnail_url: youtube_id ? `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg` : null };

    if (editingVideo) {
      const { error } = await (supabase.from('video_lessons') as any).update(payload).eq('id', editingVideo.id);
      if (error) { toast.error("Xatolik: " + error.message); return; }
      toast.success("Video yangilandi");
    } else {
      const { error } = await (supabase.from('video_lessons') as any).insert(payload);
      if (error) { toast.error("Xatolik: " + error.message); return; }
      toast.success("Video qo'shildi");
    }
    setDialogOpen(false);
    resetForm();
    fetchVideos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu videoni o'chirmoqchimisiz?")) return;
    const { error } = await (supabase.from('video_lessons') as any).delete().eq('id', id);
    if (error) { toast.error("Xatolik"); return; }
    toast.success("Video o'chirildi");
    fetchVideos();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase.from('video_lessons') as any).update({ is_active: !current }).eq('id', id);
    fetchVideos();
  };

  const handleParsePlaylist = async () => {
    if (!playlistUrl.trim()) { toast.error("Playlist URL kiriting"); return; }
    setPlaylistLoading(true);
    setParsedVideos([]);
    try {
      const { data, error } = await supabase.functions.invoke('parse-playlist', {
        body: { playlistUrl, defaultSkill: playlistSkill },
      });
      if (error) throw error;
      if (data?.videos) {
        setParsedVideos(data.videos);
        toast.success(`${data.videos.length} ta video topildi`);
      } else {
        throw new Error(data?.error || "Videolar topilmadi");
      }
    } catch (e: any) {
      toast.error(e.message || "Playlistni o'qishda xatolik");
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleImportAll = async () => {
    if (parsedVideos.length === 0) return;
    setImportProgress(0);
    const batchSize = 10;
    let imported = 0;
    for (let i = 0; i < parsedVideos.length; i += batchSize) {
      const batch = parsedVideos.slice(i, i + batchSize);
      const { error } = await (supabase.from('video_lessons') as any).insert(batch);
      if (error) { toast.error("Import xatolik: " + error.message); return; }
      imported += batch.length;
      setImportProgress(Math.round((imported / parsedVideos.length) * 100));
    }
    toast.success(`${imported} ta video import qilindi!`);
    setPlaylistDialogOpen(false);
    setParsedVideos([]);
    setPlaylistUrl('');
    fetchVideos();
  };

  const updateParsedVideoSkill = (index: number, skill: string) => {
    setParsedVideos(prev => prev.map((v, i) => i === index ? { ...v, skill } : v));
  };

  const filtered = videos.filter(v => {
    if (filterSkill !== 'all' && v.skill !== filterSkill) return false;
    if (filterLevel !== 'all' && v.level !== filterLevel) return false;
    if (searchQuery && !v.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Video Darslar</h2>
          <p className="text-sm text-muted-foreground">{videos.length} ta video</p>
        </div>
        <div className="flex gap-2">
          {/* Playlist Import */}
          <Dialog open={playlistDialogOpen} onOpenChange={(o) => { setPlaylistDialogOpen(o); if (!o) { setParsedVideos([]); setPlaylistUrl(''); } }}>
            <DialogTrigger asChild>
              <Button variant="outline"><ListVideo className="w-4 h-4 mr-2" /> Playlistdan import</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>YouTube Playlistdan import</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Playlist URL *</Label>
                  <Input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)} placeholder="https://youtube.com/playlist?list=..." />
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Standart daraja</Label>
                    <Select value={playlistLevel} onValueChange={setPlaylistLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleParsePlaylist} disabled={playlistLoading}>
                    {playlistLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yuklanmoqda...</> : 'Videolarni olish'}
                  </Button>
                </div>

                {parsedVideos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{parsedVideos.length} ta video topildi</p>
                      <Button onClick={handleImportAll} disabled={importProgress > 0 && importProgress < 100}>
                        {importProgress > 0 && importProgress < 100 ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {importProgress}%</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 mr-2" /> Barchasini import qilish</>
                        )}
                      </Button>
                    </div>
                    {importProgress > 0 && <Progress value={importProgress} className="h-2" />}
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {parsedVideos.map((v, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 text-sm">
                          {v.youtube_id && (
                            <img src={`https://img.youtube.com/vi/${v.youtube_id}/default.jpg`} alt="" className="w-16 h-10 object-cover rounded shrink-0" />
                          )}
                          <span className="flex-1 truncate text-xs">{v.title}</span>
                          <Select value={v.skill} onValueChange={val => updateParsedVideoSkill(i, val)}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{SKILLS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="w-4 h-4 mr-2" /> Video qo'shish</Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingVideo ? "Videoni tahrirlash" : "Yangi video qo'shish"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sarlavha *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Dars sarlavhasi" />
              </div>
              <div>
                <Label>YouTube URL *</Label>
                <Input value={form.youtube_url} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                {form.youtube_url && extractYouTubeId(form.youtube_url) && (
                  <img src={`https://img.youtube.com/vi/${extractYouTubeId(form.youtube_url)}/mqdefault.jpg`} alt="Thumbnail" className="mt-2 rounded-lg w-full max-w-xs" />
                )}
              </div>
              <div>
                <Label>Tavsif</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Qisqacha tavsif" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Skill</Label>
                  <Select value={form.skill} onValueChange={v => setForm(f => ({ ...f, skill: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SKILLS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Daraja</Label>
                  <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Davomiyligi</Label>
                  <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="15:30" />
                </div>
                <div>
                  <Label>Tartib raqami</Label>
                  <Input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Faol</Label>
              </div>
              <Button onClick={handleSave} className="w-full">{editingVideo ? "Saqlash" : "Qo'shish"}</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Qidirish..." className="pl-9" />
        </div>
        <Select value={filterSkill} onValueChange={setFilterSkill}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Skill" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {SKILLS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Video List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Video topilmadi</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(video => (
            <Card key={video.id} className={`border-border/50 ${!video.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  {video.youtube_id ? (
                    <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt="" className="w-28 h-16 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-28 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{video.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{video.skill}</Badge>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{video.level}</Badge>
                      {!video.is_active && <Badge variant="destructive" className="text-[10px]">Nofaol</Badge>}
                    </div>
                    {video.description && <p className="text-xs text-muted-foreground truncate">{video.description}</p>}
                    {video.duration && <span className="text-[10px] text-muted-foreground">⏱ {video.duration}</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => window.open(video.youtube_url, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(video)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(video.id, video.is_active)}>
                      <Switch checked={video.is_active} className="pointer-events-none scale-75" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(video.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
