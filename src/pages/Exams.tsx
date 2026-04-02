import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, Clock, Target, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ExamInterface } from '@/components/ExamInterface';

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  skill: string;
  level: string;
  time_limit: number;
  max_attempts: number;
  is_active: boolean;
  question_count?: number;
  attempts_used?: number;
}

const Exams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ExamData | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchMyExams();
  }, [user]);

  const fetchMyExams = async () => {
    if (!user) return;
    try {
      // Get assigned exam IDs
      const { data: assignments } = await (supabase
        .from('exam_user_assignments' as any)
        .select('exam_id')
        .eq('user_id', user.id) as any);

      if (!assignments || assignments.length === 0) { setExams([]); setLoading(false); return; }

      const examIds = assignments.map((a: any) => a.exam_id);

      // Get exam details
      const { data: examData } = await (supabase
        .from('exams' as any)
        .select('*')
        .in('id', examIds)
        .eq('is_active', true) as any);

      // Get attempts and question counts for each exam
      const enriched = await Promise.all(
        ((examData || []) as ExamData[]).map(async (exam) => {
          const { count: qCount } = await (supabase
            .from('exam_questions' as any)
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id) as any);
          const { count: aCount } = await (supabase
            .from('exam_attempts' as any)
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .eq('user_id', user.id) as any);
          return { ...exam, question_count: qCount || 0, attempts_used: aCount || 0 };
        })
      );

      setExams(enriched);
    } catch (e) {
      console.error(e);
      toast.error("Examlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const startExam = (exam: ExamData) => {
    if ((exam.attempts_used || 0) >= exam.max_attempts) {
      toast.error("Urinishlar tugadi");
      return;
    }
    if ((exam.question_count || 0) === 0) {
      toast.error("Bu examda savollar yo'q");
      return;
    }
    setActiveExam(exam);
  };

  if (activeExam) {
    return (
      <ExamInterface
        exam={activeExam}
        onFinish={() => {
          setActiveExam(null);
          fetchMyExams();
        }}
        onBack={() => setActiveExam(null)}
      />
    );
  }

  const skillColors: Record<string, string> = {
    reading: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    listening: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    grammar: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  const skillEmoji: Record<string, string> = {
    reading: '📖', listening: '🎧', grammar: '📝',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => navigate('/')} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Mening examlarim</h1>
            <p className="text-muted-foreground text-sm">Sizga tayinlangan examlar</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : exams.length === 0 ? (
          <Card className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Examlar topilmadi</h3>
            <p className="text-muted-foreground text-sm">Sizga hali exam tayinlanmagan</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => {
              const attemptsLeft = exam.max_attempts - (exam.attempts_used || 0);
              const canAttempt = attemptsLeft > 0;

              return (
                <Card key={exam.id} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xl">{skillEmoji[exam.skill] || '📋'}</span>
                        <h3 className="font-semibold">{exam.title}</h3>
                        <Badge variant="outline" className={`text-xs ${skillColors[exam.skill] || ''}`}>
                          {exam.skill}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{exam.level}</Badge>
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{exam.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.time_limit / 60} daqiqa</span>
                        <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {exam.question_count} savol</span>
                        <span className={`flex items-center gap-1 ${canAttempt ? '' : 'text-destructive'}`}>
                          {canAttempt ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {attemptsLeft}/{exam.max_attempts} urinish qoldi
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => startExam(exam)}
                      disabled={!canAttempt}
                      className="shrink-0"
                    >
                      {canAttempt ? 'Boshlash' : 'Tugagan'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Exams;
