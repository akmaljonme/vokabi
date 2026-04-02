import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ExamInterfaceProps {
  exam: {
    id: string;
    title: string;
    skill: string;
    level: string;
    time_limit: number;
    question_count?: number;
  };
  onFinish: () => void;
  onBack: () => void;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

export const ExamInterface = ({ exam, onFinish, onBack }: ExamInterfaceProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(exam.time_limit);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; passed: boolean } | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQuestions();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!loading && questions.length > 0 && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, submitted]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await (supabase
        .from('exam_questions' as any)
        .select('*')
        .eq('exam_id', exam.id)
        .order('order_index') as any);
      if (error) throw error;
      setQuestions(data || []);

      // Create attempt record
      if (user) {
        const { data: attempt } = await (supabase
          .from('exam_attempts' as any)
          .insert({ exam_id: exam.id, user_id: user.id })
          .select('id')
          .single() as any);
        if (attempt) setAttemptId(attempt.id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Savollarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setShowSubmitConfirm(false);

    let score = 0;
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    questions.forEach((q) => {
      if (answers[q.id]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
        score += q.points;
      }
    });

    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= 60;
    const timeTaken = exam.time_limit - timeLeft;

    // Save result
    if (attemptId && user) {
      await (supabase
        .from('exam_attempts' as any)
        .update({
          score,
          total_questions: questions.length,
          percentage,
          passed,
          time_taken: timeTaken,
          answers,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId) as any);
    }

    setResult({ score, total: totalPoints, percentage, passed });
    setSubmitted(true);
    setSubmitting(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  // Result screen
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.passed ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
            {result.passed ? <CheckCircle className="w-10 h-10 text-green-500" /> : <XCircle className="w-10 h-10 text-destructive" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{result.passed ? 'Tabriklaymiz! 🎉' : 'Qayta urinib ko\'ring'}</h2>
            <p className="text-muted-foreground mt-1">{exam.title}</p>
          </div>
          <div className="text-5xl font-bold text-primary">{result.percentage}%</div>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>Ball: {result.score}/{result.total}</span>
            <span>Savollar: {questions.length}</span>
          </div>
          <Progress value={result.percentage} className="h-3" />

          {/* Show answers review */}
          <div className="text-left space-y-3 max-h-64 overflow-y-auto">
            {questions.map((q, i) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
              return (
                <div key={q.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  <p className="text-sm font-medium">{i + 1}. {q.question_text}</p>
                  <p className="text-xs mt-1">
                    <span className={isCorrect ? 'text-green-600' : 'text-destructive'}>
                      Sizning javob: {userAnswer || '—'}
                    </span>
                    {!isCorrect && <span className="text-green-600 ml-2">To'g'ri: {q.correct_answer}</span>}
                  </p>
                  {q.explanation && <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>}
                </div>
              );
            })}
          </div>

          <Button onClick={onFinish} className="w-full">Examlarga qaytish</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="font-semibold text-sm">{exam.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{exam.level}</Badge>
                <Badge variant="outline" className="text-xs">{exam.skill}</Badge>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${timeLeft < 60 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        {/* Progress */}
        <Progress value={(answeredCount / questions.length) * 100} className="h-1 rounded-none" />
      </header>

      {/* Question */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        {currentQ && (
          <div className="space-y-6">
            {/* Question navigation */}
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                    i === currentIndex
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : answers[q.id]
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Question text */}
            <Card className="p-6">
              <p className="text-xs text-muted-foreground mb-2">Savol {currentIndex + 1}/{questions.length} • {currentQ.points} ball</p>
              <h2 className="text-lg font-semibold mb-6">{currentQ.question_text}</h2>

              {/* Options */}
              {currentQ.question_type === 'multiple-choice' && Array.isArray(currentQ.options) ? (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        answers[currentQ.id] === opt
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="font-medium mr-3 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : currentQ.question_type === 'true-false' ? (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(currentQ.id, opt)}
                      className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                        answers[currentQ.id] === opt
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  placeholder="Javobni kiriting..."
                  className="w-full p-4 rounded-xl border-2 border-border bg-background focus:border-primary outline-none"
                />
              )}
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Oldingi
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
                  Keyingi <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Yakunlash
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Submit confirmation */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Examni yakunlash
            </AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount}/{questions.length} savolga javob berdingiz. Yakunlashni xohlaysizmi?
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber-500 font-medium">
                  ⚠️ {questions.length - answeredCount} ta savolga javob berilmagan!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Davom etish</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Yakunlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
