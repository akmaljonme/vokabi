import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Clock, Flag, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  order_index: number;
  points: number;
}

interface ExamData {
  id: string;
  title: string;
  skill: string;
  level: string;
  time_limit: number;
  max_attempts: number;
}

interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  paragraphs: { label: string; text: string }[] | null;
  order_index: number;
}

interface AudioFile {
  id: string;
  file_url: string;
  file_name: string;
  transcript: string | null;
  order_index: number;
}

export default function ExamInterfacePage() {
  const { examId } = useParams<{ examId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [results, setResults] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const storageKey = `exam_progress_${examId}`;

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && examId) loadExam();
  }, [user, examId]);

  const loadExam = async () => {
    try {
      const [examRes, questionsRes, passagesRes, audioRes] = await Promise.all([
        supabase.from('exams').select('*').eq('id', examId!).single(),
        supabase.from('exam_questions').select('*').eq('exam_id', examId!).order('order_index'),
        supabase.from('exam_reading_passages').select('*').eq('exam_id', examId!).order('order_index'),
        supabase.from('exam_audio_files').select('*').eq('exam_id', examId!).order('order_index'),
      ]);

      if (examRes.error) throw examRes.error;
      if (questionsRes.error) throw questionsRes.error;

      setExam(examRes.data);
      setQuestions((questionsRes.data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as string[] : null,
      })));
      setPassages((passagesRes.data || []).map(p => ({
        ...p,
        paragraphs: p.paragraphs as { label: string; text: string }[] | null,
      })));
      setAudioFiles(audioRes.data || []);

      // Load saved progress
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.currentQ !== undefined) setCurrentQ(parsed.currentQ);
        if (parsed.timeLeft) setTimeLeft(parsed.timeLeft);
        if (parsed.attemptId) setAttemptId(parsed.attemptId);
      } else {
        setTimeLeft(examRes.data.time_limit);
      }

      // Create attempt if not resuming
      if (!saved || !JSON.parse(saved).attemptId) {
        const { data: attempt, error } = await supabase.from('exam_attempts').insert({
          exam_id: examId!,
          user_id: user!.id,
          total_questions: questionsRes.data?.length || 0,
        }).select('id').single();
        if (error) throw error;
        setAttemptId(attempt.id);
      }
    } catch (error: any) {
      console.error('Error loading exam:', error);
      toast.error("Examni yuklashda xatolik");
      navigate('/exams');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (isFinished || isLoading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isLoading]);

  // Auto-save
  useEffect(() => {
    if (isFinished || isLoading) return;
    localStorage.setItem(storageKey, JSON.stringify({ answers, currentQ, timeLeft, attemptId }));
  }, [answers, currentQ, timeLeft, attemptId, isFinished, isLoading]);

  // Fullscreen
  useEffect(() => {
    if (isLoading || isFinished) return;
    const enterFs = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
        }
      } catch {}
    };
    enterFs();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const handleFsChange = () => {
      if (!document.fullscreenElement && !isFinished) {
        try { containerRef.current?.requestFullscreen(); } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [isLoading, isFinished]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (option: string) => {
    const q = questions[currentQ];
    if (!q) return;
    if (q.question_type === 'list-selection') {
      const current = (answers[q.id] as string[]) || [];
      if (current.includes(option)) {
        setAnswers(prev => ({ ...prev, [q.id]: current.filter(o => o !== option) }));
      } else if (current.length < 2) {
        setAnswers(prev => ({ ...prev, [q.id]: [...current, option] }));
      }
    } else {
      setAnswers(prev => ({ ...prev, [q.id]: option }));
    }
  };

  const isSelected = (option: string) => {
    const q = questions[currentQ];
    if (!q) return false;
    const ans = answers[q.id];
    if (Array.isArray(ans)) return ans.includes(option);
    return ans === option;
  };

  const handleFinish = useCallback(async () => {
    if (isFinished) return;
    setIsFinished(true);
    localStorage.removeItem(storageKey);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    let score = 0;
    questions.forEach(q => {
      const userAns = answers[q.id];
      if (Array.isArray(q.correct_answer)) {
        if (Array.isArray(userAns) &&
          JSON.stringify([...userAns].sort()) === JSON.stringify([...(q.correct_answer as any)].sort())) {
          score += q.points;
        }
      } else {
        if (userAns === q.correct_answer) score += q.points;
      }
    });

    const totalPoints = questions.reduce((a, q) => a + q.points, 0);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    setResults({ score, total: totalPoints, percentage });

    // Save to DB
    if (attemptId) {
      try {
        await supabase.from('exam_attempts').update({
          score,
          total_questions: questions.length,
          percentage,
          passed: percentage >= 60,
          answers: answers as any,
          time_taken: exam ? exam.time_limit - timeLeft : 0,
          completed_at: new Date().toISOString(),
        }).eq('id', attemptId);
      } catch (error) {
        console.error('Error saving result:', error);
      }
    }
  }, [isFinished, questions, answers, attemptId, exam, timeLeft, storageKey]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Results screen
  if (isFinished && results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 text-center space-y-6">
            {results.percentage >= 60 ? (
              <CheckCircle className="h-20 w-20 text-primary mx-auto" />
            ) : (
              <XCircle className="h-20 w-20 text-destructive mx-auto" />
            )}
            <h1 className="text-3xl font-bold">{exam?.title}</h1>
            <div className="text-6xl font-bold text-primary">{results.percentage}%</div>
            <p className="text-muted-foreground">
              {results.score} / {results.total} ball
            </p>
            <Badge variant={results.percentage >= 60 ? 'default' : 'destructive'} className="text-lg px-4 py-1">
              {results.percentage >= 60 ? "O'tdi ✓" : "O'tmadi ✗"}
            </Badge>

            {/* Show answers review */}
            <div className="text-left space-y-3 mt-6 max-h-80 overflow-y-auto">
              {questions.map((q, i) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correct_answer;
                return (
                  <div key={q.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold mt-1">{i + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.question_text}</p>
                        <p className="text-xs mt-1">
                          <span className="text-muted-foreground">Javobingiz: </span>
                          <span className={isCorrect ? 'text-primary' : 'text-destructive'}>{String(userAns || '—')}</span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">To'g'ri javob: </span>
                            <span className="text-primary">{q.correct_answer}</span>
                          </p>
                        )}
                        {q.explanation && !isCorrect && (
                          <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button className="w-full" onClick={() => navigate('/exams')}>
              Examlarga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQ];
  const currentPassage = passages.length > 0 ? passages[0] : null;
  const isReading = exam?.skill === 'reading';
  const isListening = exam?.skill === 'listening';

  return (
    <div ref={containerRef} className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">{exam?.level}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm truncate max-w-[200px]">{exam?.title}</span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 300 ? 'text-destructive animate-pulse' : ''}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <Button size="sm" variant="destructive" onClick={() => {
              if (confirm("Examni tugatmoqchimisiz?")) handleFinish();
            }}>
              <Flag className="w-4 h-4 mr-1" />Tugatish
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Reading passage */}
        {isReading && currentPassage && (
          <div className="lg:w-1/2 bg-card border-r border-border">
            <div className="p-6 h-[calc(100vh-8rem)] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{currentPassage.title}</h2>
              {currentPassage.paragraphs ? (
                currentPassage.paragraphs.map((p, i) => (
                  <div key={i} className="mb-4">
                    <span className="font-bold text-primary mr-2">{p.label}</span>
                    <span className="leading-relaxed">{p.text}</span>
                  </div>
                ))
              ) : (
                <p className="leading-relaxed whitespace-pre-line">{currentPassage.content}</p>
              )}
            </div>
          </div>
        )}

        {/* Questions side */}
        <div className={`flex-1 flex flex-col ${isReading ? '' : 'max-w-3xl mx-auto w-full'}`}>
          {/* Listening audio */}
          {isListening && audioFiles.length > 0 && (
            <div className="bg-card border-b border-border p-4">
              <div className="max-w-2xl mx-auto">
                <audio controls className="w-full" src={audioFiles[0].file_url}>
                  Your browser does not support audio.
                </audio>
              </div>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto">
            {question && (
              <>
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-2">
                    Savol {currentQ + 1} / {questions.length}
                  </Badge>
                  <h3 className="text-lg font-semibold mt-2">{question.question_text}</h3>
                  {question.image_url && (
                    <img src={question.image_url} alt="" className="mt-3 max-h-64 rounded-lg border border-border object-contain" />
                  )}
                </div>

                {question.question_type === 'list-selection' && (
                  <p className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />2 ta javobni tanlang
                  </p>
                )}

                <div className="space-y-3 mb-6">
                  {question.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        isSelected(opt)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Question navigator */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Savollar</h4>
                <span className="text-xs text-muted-foreground">
                  {Object.keys(answers).length}/{questions.length} javob
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQ(i)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      i === currentQ
                        ? 'bg-primary text-primary-foreground'
                        : answers[q.id]
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="bg-card border-t border-border p-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <Button
                variant="outline"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(prev => prev - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />Oldingi
              </Button>
              {currentQ === questions.length - 1 ? (
                <Button onClick={() => {
                  if (confirm("Examni tugatmoqchimisiz?")) handleFinish();
                }}>
                  <Flag className="w-4 h-4 mr-1" />Tugatish
                </Button>
              ) : (
                <Button onClick={() => setCurrentQ(prev => prev + 1)}>
                  Keyingi<ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
