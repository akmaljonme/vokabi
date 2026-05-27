import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Copy, Check, Trash2, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Classroom {
  id: string;
  name: string;
  description: string;
  level: string;
  invite_code: string;
  max_students: number;
  student_count?: number;
  assignment_count?: number;
  created_at: string;
}

export const TeacherClassrooms = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', level: 'A1', max_students: 30 });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchClassrooms(); }, [user]);

  const fetchClassrooms = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
        const enriched = await Promise.all(data.map(async (c) => {
          const { count: sc } = await supabase
            .from('classroom_students')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', c.id)
            .eq('is_active', true);
          const { count: ac } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', c.id);
          return { ...c, student_count: sc || 0, assignment_count: ac || 0 };
        }));
        setClassrooms(enriched);
      }
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async () => {
    if (!user || !form.name.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('classrooms').insert({
        teacher_id: user.id,
        school_id: null,
        name: form.name,
        description: form.description,
        level: form.level,
        max_students: form.max_students,
      });
      if (error) throw error;
      toast.success("Sinf yaratildi!");
      setShowCreate(false);
      setForm({ name: '', description: '', level: 'A1', max_students: 30 });
      fetchClassrooms();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Kod nusxalandi!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteClassroom = async (id: string) => {
    if (!confirm("Sinfni o'chirishni tasdiqlaysizmi?")) return;
    await supabase.from('classrooms').update({ is_active: false }).eq('id', id);
    toast.success("Sinf o'chirildi");
    fetchClassrooms();
  };

  const levelColors: Record<string, string> = {
    A1: 'bg-green-500/10 text-green-600',
    A2: 'bg-emerald-500/10 text-emerald-600',
    B1: 'bg-blue-500/10 text-blue-600',
    B2: 'bg-indigo-500/10 text-indigo-600',
    C1: 'bg-purple-500/10 text-purple-600',
    C2: 'bg-rose-500/10 text-rose-600',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Sinflar</h2>
          <p className="text-sm text-muted-foreground">{classrooms.length} ta sinf</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          Yangi sinf
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <h3 className="font-semibold">Yangi sinf yaratish</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sinf nomi *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Masalan: 7-A sinf"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Daraja</label>
              <select
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tavsif</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Qisqacha tavsif..."
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max o'quvchi</label>
              <input
                type="number"
                value={form.max_students}
                onChange={e => setForm(f => ({ ...f, max_students: +e.target.value }))}
                min={1} max={100}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Bekor</Button>
            <Button size="sm" onClick={createClassroom} disabled={creating || !form.name.trim()} className="rounded-xl">
              {creating ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Classrooms grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Hali sinf yo'q</p>
          <p className="text-sm mt-1">Yuqoridagi "Yangi sinf" tugmasini bosing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[c.level]}`}>
                      {c.level}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteClassroom(c.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {c.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {c.student_count}/{c.max_students}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {c.assignment_count} vazifa
                </span>
              </div>

              {/* Invite code */}
              <div className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Taklif kodi</p>
                  <p className="font-mono font-bold text-sm tracking-widest">{c.invite_code}</p>
                </div>
                <button
                  onClick={() => copyCode(c.invite_code)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  {copiedCode === c.invite_code
                    ? <Check className="w-4 h-4 text-green-500" />
                    : <Copy className="w-4 h-4" />
                  }
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
