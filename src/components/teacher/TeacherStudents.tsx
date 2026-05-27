import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, TrendingUp, Award, Flame, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  full_name: string;
  avatar_url: string;
  email: string;
  classroom_name: string;
  streak: number;
  xp: number;
  tests_completed: number;
  avg_score: number;
}

export const TeacherStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [classrooms, setClassrooms] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: cls } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      setClassrooms(cls || []);
      const classroomIds = cls?.map(c => c.id) || [];
      if (classroomIds.length === 0) { setLoading(false); return; }

      const { data: enrollments } = await supabase
        .from('classroom_students')
        .select('student_id, classroom_id, classrooms(name)')
        .in('classroom_id', classroomIds)
        .eq('is_active', true);

      if (!enrollments?.length) { setLoading(false); return; }

      const studentIds = [...new Set(enrollments.map(e => e.student_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', studentIds);

      const { data: progress } = await supabase
        .from('user_progress')
        .select('user_id, xp, current_streak, tests_completed')
        .in('user_id', studentIds);

      const merged = studentIds.map(sid => {
        const profile = profiles?.find(p => p.user_id === sid);
        const prog = progress?.find(p => p.user_id === sid);
        const enrollment = enrollments.find(e => e.student_id === sid);
        return {
          id: sid,
          full_name: profile?.full_name || "Noma'lum",
          avatar_url: profile?.avatar_url || '',
          email: '',
          classroom_name: (enrollment?.classrooms as any)?.name || '',
          streak: prog?.current_streak || 0,
          xp: prog?.xp || 0,
          tests_completed: prog?.tests_completed || 0,
          avg_score: 0,
        };
      });

      setStudents(merged);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
    const matchClass = selectedClassroom === 'all' || s.classroom_name === classrooms.find(c => c.id === selectedClassroom)?.name;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="O'quvchi qidirish..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="relative">
          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="appearance-none bg-card border border-border rounded-xl px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Barcha sinflar</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">O'quvchilar topilmadi</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-5 px-4 py-3 border-b border-border text-xs text-muted-foreground font-medium">
            <span>O'quvchi</span>
            <span>Sinf</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Streak</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> XP</span>
            <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Testlar</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-2 md:grid-cols-5 items-center px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {s.full_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground md:hidden">{s.classroom_name}</p>
                  </div>
                </div>
                <span className="hidden md:block text-sm text-muted-foreground">{s.classroom_name}</span>
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold text-sm">{s.streak}</span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold text-sm">{s.xp.toLocaleString()}</span>
                </div>
                <span className="font-semibold text-sm">{s.tests_completed}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
