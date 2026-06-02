// TeacherAssignments.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, Calendar, CheckCircle, Clock, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  passing_score: number;
  xp_reward: number;
  submission_count?: number;
  classroom_name?: string;
}

export const TeacherAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    classroom_id: '',
    title: '',
    description: '',
    type: 'test',
    test_id: '',
    due_date: '',
    max_attempts: 1,
    passing_score: 60,
    xp_reward: 100,
  });

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [{ data: cls }, { data: asgn }, { data: ts }] = await Promise.all([
        (supabase as any).from('classrooms').select('id, name').eq('teacher_id', user.id).eq('is_active', true),
        (supabase as any).from('assignments').select('*, classrooms(name)').eq('teacher_id', user.id).order('created_at', { ascending: false }),
        (supabase as any).from('tests').select('id, title, level, skill').eq('is_active', true).limit(50),
      ]);
      setClassrooms(cls || []);
      setTests(ts || []);
      if (asgn) {
        const enriched = await Promise.all(asgn.map(async (a) => {
          const { count } = await (supabase as any).from('assignment_submissions').select('*', { count: 'exact', head: true }).eq('assignment_id', a.id);
          return { ...a, submission_count: count || 0, classroom_name: (a.classrooms as any)?.name };
        }));
        setAssignments(enriched);
      }
    } finally { setLoading(false); }
  };

  const createAssignment = async () => {
    if (!form.classroom_id || !form.title.trim()) return;
    setCreating(true);
    try {
      const { error } = await (supabase as any).from('assignments').insert({
        classroom_id: form.classroom_id,
        teacher_id: user?.id,
        title: form.title,
        description: form.description,
        type: form.type,
        test_id: form.test_id || null,
        due_date: form.due_date || null,
        max_attempts: form.max_attempts,
        passing_score: form.passing_score,
        xp_reward: form.xp_reward,
      });
      if (error) throw error;
      toast.success('Vazifa yaratildi!');
      setShowCreate(false);
      setForm({ classroom_id: '', title: '', description: '', type: 'test', test_id: '', due_date: '', max_attempts: 1, passing_score: 60, xp_reward: 100 });
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const typeColors: Record<string, string> = {
    test: 'bg-blue-500/10 text-blue-600',
    essay: 'bg-purple-500/10 text-purple-600',
    speaking: 'bg-orange-500/10 text-orange-600',
    vocabulary: 'bg-green-500/10 text-green-600',
  };
  const typeLabels: Record<string, string> = { test: 'Test', essay: 'Esse', speaking: 'Speaking', vocabulary: "So'z" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Vazifalar</h2>
          <p className="text-sm text-muted-foreground">{assignments.length} ta vazifa</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Yangi vazifa
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Yangi vazifa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sinf *</label>
              <select value={form.classroom_id} onChange={e => setForm(f => ({ ...f, classroom_id: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Sinf tanlang</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tur</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="test">Test</option>
                <option value="essay">Esse</option>
                <option value="speaking">Speaking</option>
                <option value="vocabulary">Vocabulary</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Sarlavha *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Vazifa nomi" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            {form.type === 'test' && (
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Test tanlang</label>
                <select value={form.test_id} onChange={e => setForm(f => ({ ...f, test_id: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Test tanlang (ixtiyoriy)</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.level} - {t.skill})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Muddat</label>
              <input type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">O'tish bali (%)</label>
              <input type="number" value={form.passing_score} onChange={e => setForm(f => ({ ...f, passing_score: +e.target.value }))} min={0} max={100} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Bekor</Button>
            <Button size="sm" onClick={createAssignment} disabled={creating || !form.classroom_id || !form.title.trim()} className="rounded-xl">
              {creating ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Hali vazifa yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[a.type]}`}>{typeLabels[a.type]}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{a.classroom_name}</span>
                    {a.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(a.due_date).toLocaleDateString('uz-UZ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {a.submission_count} topshirildi
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">+{a.xp_reward} XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
