import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Clock, Flag, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, XCircle, BookOpen, Headphones, Pen, BookA, Mic, MicOff, Loader2, Play, ExternalLink, Video, Star, MessageSquare } from 'lucide-react';

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

interface WritingEvaluation {
  overallBand: number;
  criteria: {
    taskAchievement: { score: number; feedback: string };
    coherenceAndCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
  };
  overallFeedback: string;
  correctedEssay: string;
}

interface SpeakingEvaluation {
  overallBand: number;
  criteria: {
    fluencyAndCoherence: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
    pronunciation: { score: number; feedback: string };
  };
  overallFeedback: string;
  suggestedResponse: string;
}

interface VideoSuggestion {
  weakTopics: string[];
  videos: { title: string; channel: string; url: string; description: string; topic: string }[];
  overallAdvice: string;
}

const skillConfig: Record<string, { label: string; icon: any; color: string }> = {
  vocabulary: { label: "Lug'at", icon: BookA, color: 'text-purple-500' },
  grammar: { label: 'Grammatika', icon: BookOpen, color: 'text-amber-500' },
  reading: { label: 'Reading', icon: BookOpen, color: 'text-primary' },
  listening: { label: 'Listening', icon: Headphones, color: 'text-primary' },
  writing: { label: 'Writing', icon: Pen, color: 'text-primary' },
  speaking: { label: 'Speaking', icon: Mic, color: 'text-primary' },
};

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
  const [writingAnswers, setWritingAnswers] = useState<Record<string, string>>({});
  const [speakingRecordings, setSpeakingRecordings] = useState<Record<string, Blob>>({});
  const [speakingTranscripts, setSpeakingTranscripts] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [results, setResults] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const storageKey = `exam_progress_${examId}`;

  // AI states
  const [writingEval, setWritingEval] = useState<Record<string, WritingEvaluation>>({});
  const [speakingEval, setSpeakingEval] = useState<Record<string, SpeakingEvaluation>>({});
  const [videoSuggestions, setVideoSuggestions] = useState<VideoSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.writingAnswers) setWritingAnswers(parsed.writingAnswers);
        if (parsed.speakingTranscripts) setSpeakingTranscripts(parsed.speakingTranscripts);
        if (parsed.currentQ !== undefined) setCurrentQ(parsed.currentQ);
        if (parsed.timeLeft) setTimeLeft(parsed.timeLeft);
        if (parsed.attemptId) setAttemptId(parsed.attemptId);
      } else {
        setTimeLeft(examRes.data.time_limit);
      }

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
        if (prev <= 1) { clearInterval(timer); handleFinish(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isLoading]);

  // Auto-save
  useEffect(() => {
    if (isFinished || isLoading) return;
    localStorage.setItem(storageKey, JSON.stringify({ answers, writingAnswers, speakingTranscripts, currentQ, timeLeft, attemptId }));
  }, [answers, writingAnswers, speakingTranscripts, currentQ, timeLeft, attemptId, isFinished, isLoading]);

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
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

  const isWritingSkill = exam?.skill === 'writing';
  const isSpeakingSkill = exam?.skill === 'speaking';
  const isReading = exam?.skill === 'reading';
  const isListening = exam?.skill === 'listening';
  const isVocabOrGrammar = exam?.skill === 'vocabulary' || exam?.skill === 'grammar';

  // === Recording ===
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const q = questions[currentQ];
        if (q) {
          setSpeakingRecordings(prev => ({ ...prev, [q.id]: blob }));
          // Use Web Speech API for transcription
          transcribeWithWebSpeech(blob, q.id);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Mikrofonga ruxsat berilmadi");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeWithWebSpeech = (blob: Blob, questionId: string) => {
    // Use SpeechRecognition API if available, otherwise prompt for manual transcript
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback: let user type their transcript
      toast.info("Ovozni matn sifatida yozing");
      return;
    }
    // For now, we'll use a simple approach - play back and use recognition
    toast.success("Ovoz yozildi! Transkript qo'lda kiritishingiz mumkin.");
  };

  // === AI Functions ===
  const checkWritingWithAI = async (questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    const essay = writingAnswers[questionId];
    if (!q || !essay?.trim()) { toast.error("Avval javob yozing"); return; }

    setAiLoading(`writing_${questionId}`);
    try {
      const { data, error } = await supabase.functions.invoke('check-writing', {
        body: { essay, question: q.question_text, level: exam?.level || 'B2' },
      });
      if (error) throw error;
      if (data?.result) {
        setWritingEval(prev => ({ ...prev, [questionId]: data.result }));
        toast.success("AI baholash tayyor!");
      }
    } catch (err: any) {
      toast.error(err.message || "AI tekshirishda xatolik");
    } finally {
      setAiLoading(null);
    }
  };

  const checkSpeakingWithAI = async (questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    const transcript = speakingTranscripts[questionId];
    if (!q || !transcript?.trim()) { toast.error("Avval gapiring yoki transkript kiriting"); return; }

    setAiLoading(`speaking_${questionId}`);
    try {
      const { data, error } = await supabase.functions.invoke('check-speaking', {
        body: { transcript, question: q.question_text, level: exam?.level || 'B2' },
      });
      if (error) throw error;
      if (data?.result) {
        setSpeakingEval(prev => ({ ...prev, [questionId]: data.result }));
        toast.success("AI baholash tayyor!");
      }
    } catch (err: any) {
      toast.error(err.message || "AI tekshirishda xatolik");
    } finally {
      setAiLoading(null);
    }
  };

  const loadVideoRecommendations = async () => {
    const wrongQuestions = questions.filter(q => {
      const userAns = answers[q.id];
      return userAns !== q.correct_answer;
    }).map(q => ({ question: q.question_text, correct: q.correct_answer, userAnswer: answers[q.id] || 'javob berilmagan' }));

    if (wrongQuestions.length === 0) { toast.info("Barcha javoblar to'g'ri!"); return; }

    setAiLoading('videos');
    try {
      const { data, error } = await supabase.functions.invoke('recommend-videos', {
        body: { wrongQuestions, level: exam?.level || 'B2', skill: exam?.skill || 'grammar' },
      });
      if (error) throw error;
      if (data?.result) {
        setVideoSuggestions(data.result);
      }
    } catch (err: any) {
      toast.error(err.message || "Video tavsiyalarni yuklashda xatolik");
    } finally {
      setAiLoading(null);
    }
  };

  const handleFinish = useCallback(async () => {
    if (isFinished) return;
    setIsFinished(true);
    localStorage.removeItem(storageKey);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    let score = 0;
    if (!isWritingSkill && !isSpeakingSkill) {
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
    }

    const totalPoints = questions.reduce((a, q) => a + q.points, 0);
    const percentage = (isWritingSkill || isSpeakingSkill) ? 0 : (totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0);
    setResults({ score, total: totalPoints, percentage });

    const allAnswers = isWritingSkill ? writingAnswers : isSpeakingSkill ? speakingTranscripts : answers;
    if (attemptId) {
      try {
        await supabase.from('exam_attempts').update({
          score: (isWritingSkill || isSpeakingSkill) ? null : score,
          total_questions: questions.length,
          percentage: (isWritingSkill || isSpeakingSkill) ? null : percentage,
          passed: (isWritingSkill || isSpeakingSkill) ? null : percentage >= 60,
          answers: allAnswers as any,
          time_taken: exam ? exam.time_limit - timeLeft : 0,
          completed_at: new Date().toISOString(),
        }).eq('id', attemptId);
      } catch (error) {
        console.error('Error saving result:', error);
      }
    }
  }, [isFinished, questions, answers, writingAnswers, speakingTranscripts, attemptId, exam, timeLeft, storageKey, isWritingSkill, isSpeakingSkill]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // === RESULTS SCREEN ===
  if (isFinished && results) {
    const config = skillConfig[exam?.skill || ''] || skillConfig.reading;

    // Writing results with AI evaluation
    if (isWritingSkill) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-3xl mx-auto space-y-6 py-8">
            <Card>
              <CardContent className="pt-8 text-center space-y-4">
                <Pen className="h-16 w-16 text-primary mx-auto" />
                <h1 className="text-2xl font-bold">{exam?.title} - Natijalar</h1>
                <p className="text-muted-foreground">AI yordamida har bir javobingizni tekshirishingiz mumkin</p>
              </CardContent>
            </Card>

            {questions.map((q, i) => {
              const evaluation = writingEval[q.id];
              return (
                <Card key={q.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary">{i + 1}-savol</Badge>
                        <p className="font-medium mt-2">{q.question_text}</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{writingAnswers[q.id] || '— Javob berilmagan —'}</p>
                    </div>

                    {!evaluation && (
                      <Button
                        onClick={() => checkWritingWithAI(q.id)}
                        disabled={aiLoading === `writing_${q.id}` || !writingAnswers[q.id]?.trim()}
                        className="w-full"
                      >
                        {aiLoading === `writing_${q.id}` ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI tekshirmoqda...</>
                        ) : (
                          <><Star className="w-4 h-4 mr-2" />AI bilan tekshirish</>
                        )}
                      </Button>
                    )}

                    {evaluation && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl font-bold text-primary">{evaluation.overallBand}/9</div>
                          <span className="text-sm text-muted-foreground">Umumiy baho</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'taskAchievement', label: 'Task Achievement' },
                            { key: 'coherenceAndCohesion', label: 'Coherence & Cohesion' },
                            { key: 'lexicalResource', label: 'Lexical Resource' },
                            { key: 'grammaticalRange', label: 'Grammar' },
                          ].map(({ key, label }) => {
                            const c = evaluation.criteria[key as keyof typeof evaluation.criteria];
                            return (
                              <div key={key} className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">{label}</span>
                                  <Badge variant="outline">{c.score}/9</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{c.feedback}</p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-primary/5 rounded-lg p-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />Umumiy tavsiya
                          </h4>
                          <p className="text-sm text-muted-foreground">{evaluation.overallFeedback}</p>
                        </div>

                        {evaluation.correctedEssay && (
                          <details className="bg-muted/30 rounded-lg p-4">
                            <summary className="text-sm font-medium cursor-pointer">To'g'rilangan versiya</summary>
                            <p className="text-sm mt-2 whitespace-pre-wrap">{evaluation.correctedEssay}</p>
                          </details>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button className="w-full" variant="outline" onClick={() => navigate('/exams')}>
              Examlarga qaytish
            </Button>
          </div>
        </div>
      );
    }

    // Speaking results with AI evaluation
    if (isSpeakingSkill) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-3xl mx-auto space-y-6 py-8">
            <Card>
              <CardContent className="pt-8 text-center space-y-4">
                <Mic className="h-16 w-16 text-primary mx-auto" />
                <h1 className="text-2xl font-bold">{exam?.title} - Natijalar</h1>
                <p className="text-muted-foreground">AI yordamida speaking javoblaringizni baholang</p>
              </CardContent>
            </Card>

            {questions.map((q, i) => {
              const evaluation = speakingEval[q.id];
              const transcript = speakingTranscripts[q.id];
              return (
                <Card key={q.id}>
                  <CardContent className="pt-6 space-y-4">
                    <Badge variant="secondary">{i + 1}-savol</Badge>
                    <p className="font-medium">{q.question_text}</p>

                    {transcript && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Sizning javobingiz:</p>
                        <p className="text-sm">{transcript}</p>
                      </div>
                    )}

                    {speakingRecordings[q.id] && (
                      <audio controls className="w-full" src={URL.createObjectURL(speakingRecordings[q.id])} />
                    )}

                    {!evaluation && (
                      <Button
                        onClick={() => checkSpeakingWithAI(q.id)}
                        disabled={aiLoading === `speaking_${q.id}` || !transcript?.trim()}
                        className="w-full"
                      >
                        {aiLoading === `speaking_${q.id}` ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI tekshirmoqda...</>
                        ) : (
                          <><Star className="w-4 h-4 mr-2" />AI bilan baholash</>
                        )}
                      </Button>
                    )}

                    {evaluation && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl font-bold text-primary">{evaluation.overallBand}/9</div>
                          <span className="text-sm text-muted-foreground">Umumiy baho</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'fluencyAndCoherence', label: 'Fluency & Coherence' },
                            { key: 'lexicalResource', label: 'Lexical Resource' },
                            { key: 'grammaticalRange', label: 'Grammar' },
                            { key: 'pronunciation', label: 'Pronunciation' },
                          ].map(({ key, label }) => {
                            const c = evaluation.criteria[key as keyof typeof evaluation.criteria];
                            return (
                              <div key={key} className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">{label}</span>
                                  <Badge variant="outline">{c.score}/9</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{c.feedback}</p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-primary/5 rounded-lg p-4">
                          <h4 className="text-sm font-medium mb-2">Umumiy tavsiya</h4>
                          <p className="text-sm text-muted-foreground">{evaluation.overallFeedback}</p>
                        </div>

                        {evaluation.suggestedResponse && (
                          <details className="bg-muted/30 rounded-lg p-4">
                            <summary className="text-sm font-medium cursor-pointer">Namuna javob</summary>
                            <p className="text-sm mt-2 whitespace-pre-wrap">{evaluation.suggestedResponse}</p>
                          </details>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button className="w-full" variant="outline" onClick={() => navigate('/exams')}>
              Examlarga qaytish
            </Button>
          </div>
        </div>
      );
    }

    // Regular results (MCQ) with video recommendations
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto space-y-6 py-8">
          <Card>
            <CardContent className="pt-8 text-center space-y-4">
              {results.percentage >= 60 ? (
                <CheckCircle className="h-20 w-20 text-primary mx-auto" />
              ) : (
                <XCircle className="h-20 w-20 text-destructive mx-auto" />
              )}
              <h1 className="text-3xl font-bold">{exam?.title}</h1>
              <div className="text-6xl font-bold text-primary">{results.percentage}%</div>
              <p className="text-muted-foreground">{results.score} / {results.total} ball</p>
              <Badge variant={results.percentage >= 60 ? 'default' : 'destructive'} className="text-lg px-4 py-1">
                {results.percentage >= 60 ? "O'tdi ✓" : "O'tmadi ✗"}
              </Badge>
            </CardContent>
          </Card>

          {/* Video Recommendations */}
          {results.percentage < 100 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {!videoSuggestions ? (
                  <Button
                    onClick={loadVideoRecommendations}
                    disabled={aiLoading === 'videos'}
                    className="w-full"
                    variant="secondary"
                  >
                    {aiLoading === 'videos' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Video darslar qidirilmoqda...</>
                    ) : (
                      <><Video className="w-4 h-4 mr-2" />Xatolar bo'yicha video darslar tavsiyasi</>
                    )}
                  </Button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Tavsiya etilgan video darslar</h3>
                    </div>

                    {videoSuggestions.weakTopics.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {videoSuggestions.weakTopics.map((topic, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      {videoSuggestions.videos.map((video, i) => (
                        <a
                          key={i}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Play className="w-8 h-8 text-primary shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm flex items-center gap-1">
                                {video.title}
                                <ExternalLink className="w-3 h-3" />
                              </h4>
                              <p className="text-xs text-primary">{video.channel}</p>
                              <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
                              <Badge variant="outline" className="text-xs mt-2">{video.topic}</Badge>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    <div className="bg-primary/5 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">{videoSuggestions.overallAdvice}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Answer review */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Javoblar tahlili</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
            </CardContent>
          </Card>

          <Button className="w-full" variant="outline" onClick={() => navigate('/exams')}>
            Examlarga qaytish
          </Button>
        </div>
      </div>
    );
  }

  // === EXAM INTERFACE ===
  const question = questions[currentQ];
  const currentPassage = passages.length > 0 ? passages[0] : null;
  const config = skillConfig[exam?.skill || ''] || skillConfig.reading;
  const SkillIcon = config.icon;
  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div ref={containerRef} className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <SkillIcon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">{exam?.level}</span>
              <span className="text-muted-foreground">•</span>
              <Badge variant="secondary" className="text-xs">{config.label}</Badge>
              <span className="text-sm truncate max-w-[150px] hidden sm:inline">{exam?.title}</span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 300 ? 'text-destructive animate-pulse' : ''}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <Button size="sm" variant="destructive" onClick={() => {
              if (confirm("Examni tugatmoqchimisiz?")) handleFinish();
            }}>
              <Flag className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Tugatish</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Reading: Left side passage */}
        {isReading && currentPassage && (
          <div className="lg:w-1/2 bg-card border-r border-border">
            <div className="p-6 h-[calc(100vh-3.5rem)] overflow-y-auto">
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
        <div className={`flex-1 flex flex-col ${isReading ? '' : isVocabOrGrammar ? 'max-w-2xl mx-auto w-full' : 'max-w-3xl mx-auto w-full'}`}>
          {/* Listening: Audio player */}
          {isListening && audioFiles.length > 0 && (
            <div className="bg-card border-b border-border p-4">
              <div className="max-w-2xl mx-auto space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Audio tinglang</span>
                </div>
                <audio controls className="w-full" src={audioFiles[0].file_url}>
                  Your browser does not support audio.
                </audio>
                {audioFiles[0].transcript && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="text-xs text-primary hover:underline"
                    >
                      {showTranscript ? 'Transkriptni yashirish' : 'Transkriptni ko\'rish'}
                    </button>
                    {showTranscript && (
                      <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg whitespace-pre-line">
                        {audioFiles[0].transcript}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto">
            {question && (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      Savol {currentQ + 1} / {questions.length}
                    </Badge>
                    {!isWritingSkill && !isSpeakingSkill && (
                      <Badge variant="outline" className="text-xs">
                        {question.points} ball
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mt-2">{question.question_text}</h3>
                  {question.image_url && (
                    <img src={question.image_url} alt="" className="mt-3 max-h-64 rounded-lg border border-border object-contain" />
                  )}
                </div>

                {/* Writing: Textarea */}
                {isWritingSkill ? (
                  <div className="space-y-3 mb-6">
                    <Textarea
                      placeholder="Javobingizni bu yerga yozing..."
                      className="min-h-[300px] text-base leading-relaxed resize-y"
                      value={writingAnswers[question.id] || ''}
                      onChange={e => setWritingAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{wordCount(writingAnswers[question.id] || '')} so'z</span>
                      <span>Kamida 150 so'z tavsiya etiladi</span>
                    </div>
                  </div>
                ) : isSpeakingSkill ? (
                  /* Speaking: Record + Transcript */
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      {!isRecording ? (
                        <Button onClick={startRecording} variant="outline" size="lg" className="gap-2">
                          <Mic className="w-5 h-5 text-primary" />
                          Yozishni boshlash
                        </Button>
                      ) : (
                        <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2 animate-pulse">
                          <MicOff className="w-5 h-5" />
                          To'xtatish
                        </Button>
                      )}
                      {speakingRecordings[question.id] && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="w-3 h-3" /> Yozildi
                        </Badge>
                      )}
                    </div>

                    {speakingRecordings[question.id] && (
                      <audio controls className="w-full" src={URL.createObjectURL(speakingRecordings[question.id])} />
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block">Transkript (gapirganingizni yozing):</label>
                      <Textarea
                        placeholder="Gapirgan javobingizni matn sifatida yozing..."
                        className="min-h-[150px] text-base resize-y"
                        value={speakingTranscripts[question.id] || ''}
                        onChange={e => setSpeakingTranscripts(prev => ({ ...prev, [question.id]: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {wordCount(speakingTranscripts[question.id] || '')} so'z
                      </p>
                    </div>
                  </div>
                ) : (
                  /* MCQ options */
                  <>
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
              </>
            )}

            {/* Question navigator */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Savollar</h4>
                <span className="text-xs text-muted-foreground">
                  {isWritingSkill
                    ? `${Object.keys(writingAnswers).filter(k => writingAnswers[k]?.trim()).length}/${questions.length} yozildi`
                    : isSpeakingSkill
                    ? `${Object.keys(speakingTranscripts).filter(k => speakingTranscripts[k]?.trim()).length}/${questions.length} gapirdi`
                    : `${Object.keys(answers).length}/${questions.length} javob`
                  }
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {questions.map((q, i) => {
                  const hasAnswer = isWritingSkill
                    ? !!writingAnswers[q.id]?.trim()
                    : isSpeakingSkill
                    ? !!speakingTranscripts[q.id]?.trim()
                    : !!answers[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQ(i)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        i === currentQ
                          ? 'bg-primary text-primary-foreground'
                          : hasAnswer
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
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
