import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ClipboardList, Users, TrendingUp, Clock, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  classrooms: number;
  students: number;
  assignments: number;
  avgScore: number;
}

const StatCard = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </motion.div>
);

export const TeacherOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ classrooms: 0, students: 0, assignments: 0, avgScore: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      // Classrooms
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      const classroomIds = classrooms?.map(c => c.id) || [];

      // Students
      let studentCount = 0;
      if (classroomIds.length > 0) {
        const { count } = await supabase
          .from('classroom_students')
          .select('*', { count: 'exact', head: true })
          .in('classroom_id', classroomIds)
          .eq('is_active', true);
        studentCount = count || 0;
      }

      // Assignments
      const { count: assignmentCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Recent submissions
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments(title),
          profiles:student_id(full_name, avatar_url)
        `)
        .in('assignment_id',
          (await supabase.from('assignments').select('id').eq('teacher_id', user.id)).data?.map(a => a.id) || []
        )
        .order('submitted_at', { ascending: false })
        .limit(5);

      setStats({
        classrooms: classrooms?.length || 0,
        students: studentCount,
        assignments: assignmentCount || 0,
        avgScore: 0,
      });
      setRecentSubmissions(submissions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: GraduationCap, label: 'Sinflar',       value: stats.classrooms,  color: 'bg-blue-500/10 text-blue-500',   delay: 0 },
    { icon: Users,         label: "O'quvchilar",   value: stats.students,    color: 'bg-green-500/10 text-green-500', delay: 0.05 },
    { icon: ClipboardList, label: 'Vazifalar',      value: stats.assignments, color: 'bg-orange-500/10 text-orange-500', delay: 0.1 },
    { icon: Star,          label: "O'rt. ball",    value: `${stats.avgScore}%`, color: 'bg-purple-500/10 text-purple-500', delay: 0.15 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Recent submissions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          So'nggi topshirilgan ishlar
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Hozircha topshirilgan ishlar yo'q</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSubmissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {(s.profiles?.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.profiles?.full_name || "O'quvchi"}</p>
                    <p className="text-xs text-muted-foreground">{s.assignments?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.percentage !== null ? (
                    <span className={`text-sm font-bold ${s.passed ? 'text-green-500' : 'text-red-500'}`}>
                      {s.percentage}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">Baholanmagan</span>
                  )}
                  {s.passed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Tezkor harakatlar
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Sinf yaratish", icon: GraduationCap, color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" },
            { label: "Vazifa berish", icon: ClipboardList, color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" },
            { label: "E'lon qilish",  icon: Users, color: "bg-green-500/10 text-green-600 hover:bg-green-500/20" },
          ].map(({ label, icon: Icon, color }) => (
            <button key={label} className={`flex items-center gap-2 p-3 rounded-xl transition-colors text-sm font-medium ${color}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
