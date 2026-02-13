import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Clock, BookOpen, Headphones, Pen, GraduationCap } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  skill: string;
  level: string;
  time_limit: number;
  max_attempts: number;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  percentage: number | null;
  completed_at: string | null;
}

const skillIcons: Record<string, any> = {
  reading: BookOpen,
  listening: Headphones,
  writing: Pen,
  vocabulary: BookOpen,
  grammar: BookOpen,
};

const skillLabels: Record<string, string> = {
  vocabulary: "Lug'at", grammar: 'Grammatika', reading: 'Reading',
  listening: 'Listening', writing: 'Writing',
};

export default function ExamsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchExams();
  }, [user]);

  const fetchExams = async () => {
    try {
      const [examsRes, attemptsRes] = await Promise.all([
        supabase.from('exams').select('*').eq('is_active', true),
        supabase.from('exam_attempts').select('id, exam_id, percentage, completed_at').eq('user_id', user!.id),
      ]);

      if (examsRes.error) throw examsRes.error;
      setExams(examsRes.data || []);
      setAttempts((attemptsRes.data as ExamAttempt[]) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAttemptCount = (examId: string) => {
    return attempts.filter(a => a.exam_id === examId && a.completed_at).length;
  };

  const getBestScore = (examId: string) => {
    const examAttempts = attempts.filter(a => a.exam_id === examId && a.percentage != null);
    if (examAttempts.length === 0) return null;
    return Math.max(...examAttempts.map(a => a.percentage!));
  };

  const canAttempt = (exam: Exam) => {
    return getAttemptCount(exam.id) < exam.max_attempts;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => navigate('/')} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              Examlar
            </h1>
            <p className="text-muted-foreground">Sizga ruxsat berilgan maxsus examlar</p>
          </div>
        </div>

        {exams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Lock className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Examlar mavjud emas</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Hozircha sizga tayinlangan examlar yo'q. Admin sizga exam tayinlaganda bu yerda paydo bo'ladi.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => {
              const Icon = skillIcons[exam.skill] || BookOpen;
              const attemptCount = getAttemptCount(exam.id);
              const bestScore = getBestScore(exam.id);
              const canTry = canAttempt(exam);

              return (
                <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{skillLabels[exam.skill]}</Badge>
                          <Badge variant="outline">{exam.level}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {exam.description && (
                      <p className="text-sm text-muted-foreground">{exam.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.floor(exam.time_limit / 60)} daqiqa
                      </span>
                      <span>{attemptCount}/{exam.max_attempts} urinish</span>
                    </div>
                    {bestScore !== null && (
                      <div className="text-sm">
                        Eng yaxshi natija: <span className={`font-bold ${bestScore >= 60 ? 'text-green-500' : 'text-destructive'}`}>{bestScore}%</span>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      disabled={!canTry}
                      onClick={() => toast.info("Exam interfeysi tez orada qo'shiladi")}
                    >
                      {canTry ? 'Examni Boshlash' : "Urinishlar tugadi"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
