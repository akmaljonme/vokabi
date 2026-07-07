import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Flag, AlertCircle, ArrowLeft, ArrowRight, BookOpen, Headphones, BookA, Mic, MicOff, CheckCircle, PenTool, Send, Loader2 as Loader2Icon, Sparkles, Trash2, Play, Pause, RotateCcw, Lightbulb, Target, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { MockTest, UserAnswer, Part, TestResult, Question } from '@/types/cefr';
import { generateMockTest } from '@/data/mockData';
import { useTestWithQuestions } from '@/hooks/useTests';
import { CEFRLevel, SkillType } from '@/types/cefr';
import { PartAudioPlayer } from '@/components/PartAudioPlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpeakingPanel } from '@/components/SpeakingPanel';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Lock as LockIcon } from 'lucide-react';
import { TextHighlighter } from '@/components/TextHighlighter';

interface TestInterfaceProps {
  level: CEFRLevel;
  skill: SkillType;
  mockId: number;
  testId?: string | null;
  onFinish: (result: TestResult) => void;
  onBack: () => void;
}

const skillConfig: Record<string, { label: string; icon: any; color: string }> = {
  vocabulary: { label: "Lug'at", icon: BookA, color: 'text-purple-500' },
  grammar: { label: 'Grammatika', icon: BookOpen, color: 'text-amber-500' },
  reading: { label: 'Reading', icon: BookOpen, color: 'text-primary' },
  listening: { label: 'Listening', icon: Headphones, color: 'text-primary' },
  writing: { label: 'Writing', icon: PenTool, color: 'text-emerald-500' },
  speaking: { label: 'Speaking', icon: Mic, color: 'text-rose-500' },
};

export const TestInterface = ({ level, skill, mockId, testId, onFinish, onBack }: TestInterfaceProps) => {
  const testStorageKey = `test_progress_${testId || `${level}_${skill}_${mockId}`}`;
  const { isPro, loading: proLoading } = useSubscription();
  const requiresPro = skill === 'writing' || skill === 'speaking';

  const [mockTest, setMockTest] = useState<MockTest | null>(null);
  const [currentPart, setCurrentPart] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const containerRef = useRef<HTMLDivElement>(null);

  const isNoParts = skill === 'vocabulary' || skill === 'grammar';
  const isWriting = skill === 'writing';
  const isSpeaking = skill === 'speaking';
  const isOpenEnded = isWriting || isSpeaking;

  // Writing state - support multiple parts
  const [writingTexts, setWritingTexts] = useState<Record<number, string>>({});
  
  // Speaking state - support multiple questions
  const [isRecording, setIsRecording] = useState(false);
  const [speakingRecordings, setSpeakingRecordings] = useState<Record<number, { blob: Blob; url: string }>>({});
  const [speakingTranscripts, setSpeakingTranscripts] = useState<Record<number, string>>({});
  const [speakingSubmitting, setSpeakingSubmitting] = useState(false);
  const [currentSpeakingQ, setCurrentSpeakingQ] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const { test: dbTest, loading: dbLoading } = useTestWithQuestions(testId);

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(testStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.currentPart) setCurrentPart(parsed.currentPart);
        if (parsed.currentQuestion) setCurrentQuestion(parsed.currentQuestion);
        if (parsed.timeLeft) setTimeLeft(parsed.timeLeft);
      }
    } catch {}
  }, [testStorageKey]);

  useEffect(() => {
    if (testId && dbTest) {
      setMockTest(dbTest);
      const saved = localStorage.getItem(testStorageKey);
      if (!saved) setTimeLeft(dbTest.timeLimit);
    } else if (!testId) {
      const test = generateMockTest(mockId, level, skill);
      setMockTest(test);
      const saved = localStorage.getItem(testStorageKey);
      if (!saved) setTimeLeft(test.timeLimit);
    }
  }, [mockId, level, skill, testId, dbTest, testStorageKey]);

  // Sync dark mode with fullscreen container
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsPaused(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    enterFullscreen();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Test hali tugamagan. Chiqishni xohlaysizmi?';
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && mockTest) {
        setIsPaused(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [mockTest, enterFullscreen]);

  // Timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) { clearInterval(timer); handleFinishTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Auto-save
  useEffect(() => {
    if (!mockTest) return;
    localStorage.setItem(testStorageKey, JSON.stringify({ answers, currentPart, currentQuestion, timeLeft }));
  }, [answers, currentPart, currentQuestion, timeLeft, testStorageKey, mockTest]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPart = (): Part | undefined => mockTest?.parts.find((p) => p.id === currentPart);
  const getCurrentQuestionInPart = (): Question | undefined => getCurrentPart()?.questions[currentQuestion - 1];

  const getAnswer = (questionId: number): string | string[] | undefined => {
    return answers.find((a) => a.questionId === questionId)?.answer;
  };

  const setAnswer = (answer: string | string[]) => {
    const questionId = getQuestionNumber();
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      const newAnswer: UserAnswer = { questionId, partId: currentPart, answer };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  };

  const getTotalQuestions = (): number => {
    if (!mockTest) return 0;
    return mockTest.parts.reduce((acc, part) => acc + part.questions.length, 0);
  };

  const getQuestionNumber = (): number => {
    if (isNoParts) return currentQuestion;
    return (currentPart - 1) * 10 + currentQuestion;
  };

  const isQuestionAnswered = (partId: number, questionIndex: number): boolean => {
    if (isNoParts) return answers.some((a) => a.questionId === questionIndex + 1);
    const questionId = (partId - 1) * 10 + questionIndex + 1;
    return answers.some((a) => a.questionId === questionId);
  };

  const getCurrentQuestionForNoParts = (): Question | undefined => {
    if (!mockTest) return undefined;
    return mockTest.parts.flatMap(p => p.questions)[currentQuestion - 1];
  };

  const handleOptionClick = (option: string) => {
    const question = isNoParts ? getCurrentQuestionForNoParts() : getCurrentQuestionInPart();
    if (!question) return;
    if (question.type === 'list-selection') {
      const current = (getAnswer(getQuestionNumber()) as string[]) || [];
      if (current.includes(option)) setAnswer(current.filter((o) => o !== option));
      else if (current.length < 2) setAnswer([...current, option]);
    } else {
      setAnswer(option);
      // Auto-advance to next question after selecting an answer
      setTimeout(() => {
        handleNavigate('next');
      }, 350);
    }
  };

  const isOptionSelected = (option: string): boolean => {
    const answer = getAnswer(getQuestionNumber());
    if (Array.isArray(answer)) return answer.includes(option);
    return answer === option;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const total = getTotalQuestions();
    const partsCount = mockTest?.parts.length || 1;
    const questionsPerPart = mockTest ? Math.ceil(total / partsCount) : 10;
    if (isNoParts) {
      if (direction === 'next' && currentQuestion < total) setCurrentQuestion(prev => prev + 1);
      else if (direction === 'prev' && currentQuestion > 1) setCurrentQuestion(prev => prev - 1);
    } else {
      if (direction === 'next') {
        if (currentQuestion < questionsPerPart) setCurrentQuestion(prev => prev + 1);
        else if (currentPart < partsCount) { setCurrentPart(prev => prev + 1); setCurrentQuestion(1); }
      } else {
        if (currentQuestion > 1) setCurrentQuestion(prev => prev - 1);
        else if (currentPart > 1) { setCurrentPart(prev => prev - 1); setCurrentQuestion(questionsPerPart); }
      }
    }
  };

  const handleFinishTest = () => {
    if (!mockTest) return;
    localStorage.removeItem(testStorageKey);

    // For writing/speaking, submit to AI for evaluation
    if (isWriting || isSpeaking) {
      const submitOpenEnded = async () => {
        setSpeakingSubmitting(true);
        try {
          const allWritingText = Object.values(writingTexts).join('\n\n---\n\n');
          const functionName = isWriting ? 'check-writing' : 'check-speaking';
          const body = isWriting
            ? { essay: allWritingText, question: mockTest.parts.map(p => p.passage.content).join(' | '), level }
            : { transcript: Object.values(speakingTranscripts).filter(Boolean).join('\n\n') || '[Audio submitted - no transcript available]', question: mockTest.parts[0]?.questions.map(q => q.question).join(' | ') || '', level };

          const { supabase } = await import('@/integrations/supabase/client');
          const { data, error } = await supabase.functions.invoke(functionName, { body });
          if (error) throw error;
          if (data?.fallback) {
            toast.warning("AI krediti vaqtincha yetarli emas. Soddalashtirilgan baholash ko'rsatildi.");
          }

          const totalParts = isWriting ? mockTest.parts.length : mockTest.parts[0]?.questions.length || 0;
          onFinish({
            mockId, level, skill, totalQuestions: totalParts,
            correctAnswers: 0, percentage: 0,
            passed: false,
            answers: isWriting 
              ? mockTest.parts.map((p, i) => ({
                  questionId: i + 1, partId: p.id,
                  userAnswer: writingTexts[p.id] || '',
                  correctAnswer: '', isCorrect: false,
                }))
              : mockTest.parts[0]?.questions.map((q, i) => ({
                  questionId: q.id, partId: 1,
                  userAnswer: speakingRecordings[i] ? '[Audio]' : '',
                  correctAnswer: '', isCorrect: false,
                })) || [],
            timeTaken: mockTest.timeLimit - timeLeft,
            mockTest,
            aiResult: data?.result,
          } as TestResult);
        } catch (error: any) {
          toast.error(error?.message || "AI baholash hozircha ishlamadi");
          onFinish({
            mockId, level, skill, totalQuestions: 1,
            correctAnswers: 0, percentage: 0, passed: false,
            answers: [], timeTaken: mockTest.timeLimit - timeLeft, mockTest,
          });
        } finally {
          setSpeakingSubmitting(false);
        }
      };
      submitOpenEnded();
      return;
    }

    const results: TestResult['answers'] = [];
    let correctCount = 0;

    mockTest.parts.forEach((part) => {
      part.questions.forEach((question) => {
        const userAnswer = answers.find((a) => a.questionId === question.id);
        const userAnswerValue = userAnswer?.answer;
        const isCorrect = Array.isArray(question.correctAnswer)
          ? Array.isArray(userAnswerValue)
            ? JSON.stringify([...userAnswerValue].sort()) === JSON.stringify([...question.correctAnswer].sort())
            : false
          : userAnswerValue === question.correctAnswer;

        if (isCorrect) correctCount++;
        results.push({
          questionId: question.id,
          partId: part.id,
          userAnswer: userAnswer?.answer || '',
          correctAnswer: question.correctAnswer,
          isCorrect,
        });
      });
    });

    const totalQuestions = mockTest.parts.reduce((acc, part) => acc + part.questions.length, 0);
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    onFinish({
      mockId, level, skill, totalQuestions,
      correctAnswers: correctCount, percentage,
      passed: percentage >= 70,
      answers: results,
      timeTaken: mockTest.timeLimit - timeLeft,
      mockTest,
    });
  };

  if (!mockTest || (testId && dbLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (requiresPro && !proLoading && !isPro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center card-elevated p-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-primary/5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
            <LockIcon className="w-8 h-8 text-amber-500" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="font-display font-bold text-xl">
              {skill === 'writing' ? 'Writing' : 'Speaking'} — Pro versiya
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Bu test faqat <span className="font-semibold text-foreground">Pro</span> foydalanuvchilar uchun.
            Pro versiyada AI tomonidan IELTS standarti bo'yicha baholash, batafsil tahlil va namuna javoblar mavjud.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://t.me/vokabi_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Crown className="w-4 h-4" />
              Pro versiyaga o'tish (@vokabi_bot)
            </a>
            <button onClick={onBack} className="btn-outline text-sm">Orqaga qaytish</button>
          </div>
        </div>
      </div>
    );
  }

  const part = getCurrentPart();
  const question = isNoParts ? getCurrentQuestionForNoParts() : getCurrentQuestionInPart();
  const totalQ = getTotalQuestions();
  const config = skillConfig[skill] || skillConfig.reading;
  const SkillIcon = config.icon;

  return (
    <div ref={containerRef} className={`min-h-screen bg-background text-foreground flex flex-col ${isDark ? 'dark' : ''}`}>
      {/* Header - same as ExamInterface */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <SkillIcon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">{level}</span>
              <span className="text-muted-foreground">•</span>
              <Badge variant="secondary" className="text-xs">{config.label}</Badge>
              <span className="text-sm truncate max-w-[150px] hidden sm:inline">Mock Test {mockId}</span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 300 ? 'text-destructive animate-pulse' : ''}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <Button size="sm" variant="destructive" onClick={() => setShowConfirmFinish(true)}>
              <Flag className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Tugatish</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Part Tabs */}
      {!isNoParts && mockTest.parts.length > 1 && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex">
              {mockTest.parts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentPart(p.id); setCurrentQuestion(1); }}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    currentPart === p.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Part {p.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Reading: Left side passage */}
        {skill === 'reading' && part && (
          <div className="lg:w-1/2 bg-card border-r border-border">
            <div className="p-4 sm:p-6 h-[40vh] lg:h-[calc(100vh-3.5rem)] overflow-y-auto">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{part.passage.title}</h2>
              <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
                💡 Muhim so'z/jumlani belgilash uchun uni sichqoncha bilan tanlang
              </p>
              <TextHighlighter>
                {part.passage.paragraphs?.map((para) => (
                  <div key={para.label} className="mb-3 sm:mb-4">
                    <span className="font-bold text-primary mr-2">{para.label}</span>
                    <span className="leading-relaxed text-sm sm:text-base">{para.text}</span>
                  </div>
                )) || (
                  <p className="leading-relaxed whitespace-pre-line text-sm sm:text-base">{part.passage.content}</p>
                )}
              </TextHighlighter>
            </div>
          </div>
        )}

        {/* Questions side */}
        <div className={`flex-1 flex flex-col ${skill === 'reading' ? '' : isNoParts ? 'max-w-2xl mx-auto w-full' : 'max-w-3xl mx-auto w-full'}`}>
          {/* Listening: Audio player */}
          {skill === 'listening' && part && (
            <div className="bg-card border-b border-border p-4">
              <div className="max-w-2xl mx-auto space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Audio tinglang</span>
                </div>
                {part.audioUrl ? (
                  <PartAudioPlayer
                    audioUrl={part.audioUrl}
                    label={`Part ${currentPart} Audio`}
                    transcript={part.audioTranscript}
                  />
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    Bu part uchun audio fayl mavjud emas
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {/* Writing Interface - Multi-part */}
            {isWriting && mockTest && (
              <div className="max-w-4xl mx-auto">
                {mockTest.parts.map((writePart) => (
                  currentPart === writePart.id && (() => {
                    const text = writingTexts[writePart.id] || '';
                    const wordCount = text.split(/\s+/).filter(Boolean).length;
                    const charCount = text.length;
                    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
                    // Task 1 has shorter target (150), Task 2 default 250
                    const isTask1 = /task\s*1/i.test(writePart.title) || writePart.id === 1;
                    const targetWords = isTask1 ? 150 : 250;
                    const minWords = isTask1 ? 130 : 220;
                    const progress = Math.min((wordCount / targetWords) * 100, 100);
                    const wordColor = wordCount === 0 ? 'text-muted-foreground'
                      : wordCount < minWords ? 'text-destructive'
                      : wordCount < targetWords ? 'text-amber-500'
                      : 'text-emerald-500';

                    return (
                      <div key={writePart.id} className="space-y-6">
                        {/* Question card */}
                        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-500">
                              <PenTool className="w-3 h-3 mr-1" />{writePart.title}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Target className="w-3 h-3 mr-1" />Maqsad: {targetWords}+ so'z
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />Tavsiya: {isTask1 ? '20' : '40'} daqiqa
                            </Badge>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold mb-3">{writePart.passage.title}</h3>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">{writePart.passage.content}</p>
                          {writePart.instruction && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-3 italic flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                              {writePart.instruction}
                            </p>
                          )}
                          {writePart.questions[0] && (
                            <div className="mt-4 p-4 bg-background/80 backdrop-blur rounded-xl border-2 border-dashed border-primary/30">
                              <p className="font-semibold text-base">{writePart.questions[0].question}</p>
                            </div>
                          )}
                        </div>

                        {/* Writing area with stats bar */}
                        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                          {/* Stats bar */}
                          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b bg-muted/30">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`text-base font-bold tabular-nums ${wordColor}`}>
                                {wordCount}
                              </span>
                              <span className="text-xs text-muted-foreground">/ {targetWords} so'z</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-32">
                                <div
                                  className={`h-full transition-all ${wordCount < minWords ? 'bg-destructive' : wordCount < targetWords ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{charCount} belgi</span>
                              <span>•</span>
                              <span>{sentenceCount} gap</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <Save className="w-3 h-3" />
                              <span className="hidden sm:inline">Avto-saqlanmoqda</span>
                            </div>
                          </div>

                          {/* Tip strip */}
                          {wordCount > 0 && wordCount < minWords && (
                            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Eslatma: kamida {minWords} so'z bo'lmasa, ball pasayadi.</span>
                            </div>
                          )}
                          {wordCount >= targetWords && (
                            <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Ajoyib! Maqsadli so'zlar soniga yetdingiz.</span>
                            </div>
                          )}

                          <Textarea
                            value={text}
                            onChange={(e) => setWritingTexts(prev => ({ ...prev, [writePart.id]: e.target.value }))}
                            placeholder={`Insho strukturasi:\n\n1. Kirish (Introduction) — mavzuni qisqa tanishtiring va o'z fikringizni bildiring\n2. Asosiy qism (Body 1) — birinchi argument va misol\n3. Asosiy qism (Body 2) — ikkinchi argument va misol\n4. Xulosa (Conclusion) — fikringizni yakunlang\n\nShu yerga yozishni boshlang...`}
                            className="min-h-[400px] text-base leading-relaxed border-0 rounded-none focus-visible:ring-0 resize-y"
                          />

                          {/* Action bar */}
                          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-muted/20">
                            <button
                              onClick={() => {
                                if (text && confirm("Yozganingizni o'chirishni xohlaysizmi?")) {
                                  setWritingTexts(prev => ({ ...prev, [writePart.id]: '' }));
                                }
                              }}
                              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />Tozalash
                            </button>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span>AI baholaydi</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>
            )}

            {/* Speaking Interface - Multi-question */}
            {isSpeaking && mockTest && mockTest.parts[0] && (
              <SpeakingPanel
                questions={mockTest.parts[0].questions}
                currentIdx={currentSpeakingQ}
                setCurrentIdx={setCurrentSpeakingQ}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                recordings={speakingRecordings}
                setRecordings={setSpeakingRecordings}
                transcripts={speakingTranscripts}
                setTranscripts={setSpeakingTranscripts}
                mediaRecorderRef={mediaRecorderRef}
                chunksRef={chunksRef}
                recognitionRef={recognitionRef}
                onFinish={() => setShowConfirmFinish(true)}
              />
            )}

            {/* Standard question-based interface */}
            {!isOpenEnded && question && (
              <>
                {/* Question header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      Savol {getQuestionNumber()} / {totalQ}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {question.type.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  {!isNoParts && part && (
                    <p className="text-sm text-muted-foreground mb-4">{part.instruction}</p>
                  )}
                  <h3 className="text-lg font-semibold">{question.question}</h3>
                  {question.imageUrl && (
                    <img src={question.imageUrl} alt="Savol rasmi" className="mt-3 max-h-64 rounded-lg border border-border object-contain" />
                  )}
                </div>

                {/* Options */}
                {question.type === 'list-selection' && (
                  <p className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />2 ta javobni tanlang
                  </p>
                )}
                <div className="space-y-3 mb-6">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        isOptionSelected(option)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Question navigator */}
            {!isOpenEnded && (
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">
                    {isNoParts ? 'Savollar' : `Part ${currentPart} Savollar`}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {answers.length}/{totalQ} javob berildi
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {isNoParts ? (
                    Array.from({ length: totalQ }, (_, i) => {
                      const isAnswered = answers.some(a => a.questionId === i + 1);
                      const isCurrent = i + 1 === currentQuestion;
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentQuestion(i + 1)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : isAnswered
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })
                  ) : (
                    Array.from({ length: part?.questions.length || 10 }, (_, i) => {
                      const isAnswered = isQuestionAnswered(currentPart, i);
                      const isCurrent = i + 1 === currentQuestion;
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentQuestion(i + 1)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : isAnswered
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="bg-card border-t border-border p-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {isWriting ? (
                <>
                  <Button
                    variant="outline"
                    disabled={currentPart === 1}
                    onClick={() => setCurrentPart(p => p - 1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />Oldingi Part
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {Object.values(writingTexts).filter(t => t.trim()).length}/{mockTest?.parts.length || 2} part yozildi
                  </span>
                  {currentPart < (mockTest?.parts.length || 2) ? (
                    <Button onClick={() => setCurrentPart(p => p + 1)}>
                      Keyingi Part<ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setShowConfirmFinish(true)} 
                      disabled={speakingSubmitting || Object.values(writingTexts).every(t => !t.trim())}
                    >
                      {speakingSubmitting ? (
                        <><Loader2Icon className="w-4 h-4 mr-1 animate-spin" />Tekshirilmoqda...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-1" />AI baholash</>
                      )}
                    </Button>
                  )}
                </>
              ) : isSpeaking ? (
                // Speaking has its own navigation inside the component
                <div />
              ) : (
                <>
                  <Button
                    variant="outline"
                    disabled={isNoParts ? currentQuestion === 1 : (currentPart === 1 && currentQuestion === 1)}
                    onClick={() => handleNavigate('prev')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />Oldingi
                  </Button>
                  <span className="text-sm text-muted-foreground">{answers.length}/{totalQ} javob</span>
                  {(isNoParts ? currentQuestion === totalQ : (currentPart === (mockTest?.parts.length || 4) && currentQuestion === (part?.questions.length || 10))) ? (
                    <Button onClick={() => setShowConfirmFinish(true)}>
                      <Flag className="w-4 h-4 mr-1" />Tugatish
                    </Button>
                  ) : (
                    <Button onClick={() => handleNavigate('next')}>
                      Keyingi<ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center animate-slide-up shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Test pauzalandi</h3>
            <p className="text-muted-foreground mb-6">
              Siz to'liq ekran rejimidan chiqdingiz. Davom etish uchun qayta to'liq ekranga o'ting.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowConfirmFinish(true);
                setIsPaused(false);
              }}>
                <Flag className="w-4 h-4 mr-1" />Tugatish
              </Button>
              <Button className="flex-1" onClick={enterFullscreen}>
                Davom etish
              </Button>
            </div>
          </div>
        </div>
      )}


      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-xl font-bold mb-2">Testni tugataysizmi?</h3>
            <p className="text-muted-foreground mb-4">
              Siz {answers.length} ta savolga javob berdingiz ({totalQ} tadan).
              {answers.length < totalQ && ` ${totalQ - answers.length} ta savol javobsiz qoldi.`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmFinish(false)}>
                Davom etish
              </Button>
              <Button className="flex-1" onClick={() => {
                handleFinishTest();
                if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
              }}>
                Tugatish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
