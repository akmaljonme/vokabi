import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Lock, Clock, BookOpen, Headphones, Pen, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

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
  reading: BookOpen, listening: Headphones, writing: Pen, vocabulary: BookOpen, grammar: BookOpen,
};

const skillLabels: Record<string, string> = {
  vocabulary: "Lug'at", grammar: 'Grammatika', reading: 'Reading', listening: 'Listening', writing: 'Writing',
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

  const getAttemptCount = (examId: string) => attempts.filter(a => a.exam_id === examId && a.completed_at).length;
  const getBestScore = (examId: string) => {
    const ea = attempts.filter(a => a.exam_id === examId && a.percentage != null);
    return ea.length === 0 ? null : Math.max(...ea.map(a => a.percentage!));
  };
  const canAttempt = (exam: Exam) => getAttemptCount(exam.id) < exam.max_attempts;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => navigate('/')} />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Examlar
            </h1>
            <p className="text-sm text-muted-foreground">Sizga tayinlangan maxsus examlar</p>
          </div>
        </motion.div>

        {exams.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Lock className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2">Examlar mavjud emas</h3>
                <p className="text-muted-foreground text-sm text-center max-w-sm">
                  Hozircha sizga tayinlangan examlar yo'q. Admin sizga exam tayinlaganda bu yerda paydo bo'ladi.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam, index) => {
              const Icon = skillIcons[exam.skill] || BookOpen;
              const attemptCount = getAttemptCount(exam.id);
              const bestScore = getBestScore(exam.id);
              const canTry = canAttempt(exam);

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card className="border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{exam.title}</CardTitle>
                          <div className="flex gap-1.5 mt-1">
                            <Badge variant="secondary" className="text-[10px]">{skillLabels[exam.skill]}</Badge>
                            <Badge variant="outline" className="text-[10px]">{exam.level}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {exam.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{exam.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(exam.time_limit / 60)} daqiqa
                        </span>
                        <span>{attemptCount}/{exam.max_attempts} urinish</span>
                      </div>
                      {bestScore !== null && (
                        <div className="text-xs">
                          Eng yaxshi: <span className={`font-bold ${bestScore >= 60 ? 'text-emerald-500' : 'text-destructive'}`}>{bestScore}%</span>
                        </div>
                      )}
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button className="w-full" size="sm" disabled={!canTry} onClick={() => navigate(`/exams/${exam.id}`)}>
                          {canTry ? 'Examni Boshlash' : "Urinishlar tugadi"}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
