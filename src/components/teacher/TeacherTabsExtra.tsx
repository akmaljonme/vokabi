import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, Users, Plus, Megaphone, Bell, CheckCheck } from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Analytics ───────────────────────────────────────────────────────────────
export const TeacherAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      const { data: cls } = await supabase.from('classrooms').select('id, name, level').eq('teacher_id', user.id).eq('is_active', true);
      const classroomIds = cls?.map(c => c.id) || [];

      let totalStudents = 0, totalSubmissions = 0, passedSubmissions = 0;
      const classroomStats: any[] = [];

      for (const c of cls || []) {
        const { count: sc } = await supabase.from('classroom_students').select('*', { count: 'exact', head: true }).eq('classroom_id', c.id).eq('is_active', true);
        const assignmentIds = (await supabase.from('assignments').select('id').eq('classroom_id', c.id)).data?.map(a => a.id) || [];
        let avg = 0, subs = 0, passed = 0;
        if (assignmentIds.length > 0) {
          const { data: subData } = await supabase.from('assignment_submissions').select('percentage, passed').in('assignment_id', assignmentIds);
          subs = subData?.length || 0;
          passed = subData?.filter(s => s.passed).length || 0;
          avg = subData?.length ? Math.round(subData.reduce((a, s) => a + (s.percentage || 0), 0) / subData.length) : 0;
        }
        totalStudents += sc || 0;
        totalSubmissions += subs;
        passedSubmissions += passed;
        classroomStats.push({ name: c.name, level: c.level, students: sc || 0, avg, subs, passed });
      }

      setData({ totalStudents, totalSubmissions, passedSubmissions, passRate: totalSubmissions ? Math.round(passedSubmissions / totalSubmissions * 100) : 0, classroomStats });
    } finally { setLoading(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Jami o'quvchi", value: data.totalStudents, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Topshirilgan', value: data.totalSubmissions, icon: BarChart3, color: 'text-orange-500 bg-orange-500/10' },
          { label: "O'tganlar", value: data.passedSubmissions, icon: Award, color: 'text-green-500 bg-green-500/10' },
          { label: "O'tish darajasi", value: `${data.passRate}%`, icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold mb-4">Sinflar bo'yicha statistika</h3>
        {data.classroomStats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Ma'lumot yo'q</p>
        ) : (
          <div className="space-y-3">
            {data.classroomStats.map((c: any, i: number) => (
              <motion.div key={c.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.avg}% o'rtacha</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${c.avg}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${c.avg >= 70 ? 'bg-green-500' : c.avg >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{c.students} o'q</p>
                  <p className="text-xs text-muted-foreground">{c.subs} topsh</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const TeacherAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ classroom_id: '', title: '', content: '', is_pinned: false });

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: cls } = await supabase.from('classrooms').select('id, name').eq('teacher_id', user.id).eq('is_active', true);
      setClassrooms(cls || []);
      const classroomIds = cls?.map(c => c.id) || [];
      if (classroomIds.length > 0) {
        const { data } = await supabase.from('announcements').select('*, classrooms(name)').in('classroom_id', classroomIds).order('created_at', { ascending: false });
        setAnnouncements(data || []);
      }
    } finally { setLoading(false); }
  };

  const createAnnouncement = async () => {
    if (!form.classroom_id || !form.title.trim()) return;
    setCreating(true);
    try {
      await supabase.from('announcements').insert({ ...form, teacher_id: user?.id });
      toast.success("E'lon yuborildi!");
      setShowCreate(false);
      setForm({ classroom_id: '', title: '', content: '', is_pinned: false });
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">E'lonlar</h2>
          <p className="text-sm text-muted-foreground">{announcements.length} ta e'lon</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Yangi e'lon
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Yangi e'lon</h3>
          <select value={form.classroom_id} onChange={e => setForm(f => ({ ...f, classroom_id: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Sinf tanlang</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Sarlavha" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Matn..." rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="rounded" />
            Muhimga qo'yish
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Bekor</Button>
            <Button size="sm" onClick={createAnnouncement} disabled={creating || !form.classroom_id || !form.title.trim()} className="rounded-xl">
              {creating ? 'Yuborilmoqda...' : 'Yuborish'}
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}</div>
      : announcements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Hali e'lon yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-2xl p-4 ${a.is_pinned ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {a.is_pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">📌 Muhim</span>}
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{(a.classrooms as any)?.name} • {new Date(a.created_at).toLocaleDateString('uz-UZ')}</p>
                  {a.content && <p className="text-sm text-muted-foreground">{a.content}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const TeacherNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
      setNotifications(data || []);
    } finally { setLoading(false); }
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("Hammasi o'qildi");
  };

  const typeIcons: Record<string, string> = { assignment: '📋', streak: '🔥', achievement: '🏆', grade: '✅', announcement: '📢', payment: '💳' };
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Bildirishnomalar</h2>
          <p className="text-sm text-muted-foreground">{unreadCount} ta o'qilmagan</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 rounded-xl">
            <CheckCheck className="w-4 h-4" /> Hammasini o'qildi
          </Button>
        )}
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
      : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Bildirishnomalar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${n.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'}`}
            >
              <span className="text-xl">{typeIcons[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('uz-UZ')}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
