import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Flag, AlertCircle, ArrowLeft, ArrowRight, BookOpen, Headphones, BookA, Mic, MicOff, CheckCircle } from 'lucide-react';
import { MockTest, UserAnswer, Part, TestResult, Question } from '@/types/cefr';
import { generateMockTest } from '@/data/mockData';
import { useTestWithQuestions } from '@/hooks/useTests';
import { CEFRLevel, SkillType } from '@/types/cefr';
import { PartAudioPlayer } from '@/components/PartAudioPlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
};

export const TestInterface = ({ level, skill, mockId, testId, onFinish, onBack }: TestInterfaceProps) => {
  const testStorageKey = `test_progress_${testId || `${level}_${skill}_${mockId}`}`;

  const [mockTest, setMockTest] = useState<MockTest | null>(null);
  const [currentPart, setCurrentPart] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isNoParts = skill === 'vocabulary' || skill === 'grammar';

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

  // Fullscreen
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (containerRef.current && document.fullscreenElement === null) {
          await containerRef.current.requestFullscreen();
        }
      } catch {}
    };
    enterFullscreen();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Test hali tugamagan. Chiqishni xohlaysizmi?';
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && mockTest) {
        try { containerRef.current?.requestFullscreen(); } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [mockTest]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) { clearInterval(timer); handleFinishTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    }
  };

  const isOptionSelected = (option: string): boolean => {
    const answer = getAnswer(getQuestionNumber());
    if (Array.isArray(answer)) return answer.includes(option);
    return answer === option;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const total = getTotalQuestions();
    if (isNoParts) {
      if (direction === 'next' && currentQuestion < total) setCurrentQuestion(prev => prev + 1);
      else if (direction === 'prev' && currentQuestion > 1) setCurrentQuestion(prev => prev - 1);
    } else {
      if (direction === 'next') {
        if (currentQuestion < 10) setCurrentQuestion(prev => prev + 1);
        else if (currentPart < 4) { setCurrentPart(prev => prev + 1); setCurrentQuestion(1); }
      } else {
        if (currentQuestion > 1) setCurrentQuestion(prev => prev - 1);
        else if (currentPart > 1) { setCurrentPart(prev => prev - 1); setCurrentQuestion(10); }
      }
    }
  };

  const handleFinishTest = () => {
    if (!mockTest) return;
    localStorage.removeItem(testStorageKey);

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

  const part = getCurrentPart();
  const question = isNoParts ? getCurrentQuestionForNoParts() : getCurrentQuestionInPart();
  const totalQ = getTotalQuestions();
  const config = skillConfig[skill] || skillConfig.reading;
  const SkillIcon = config.icon;

  return (
    <div ref={containerRef} className="min-h-screen bg-muted/30 flex flex-col">
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
      {!isNoParts && (
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
            <div className="p-6 h-[calc(100vh-3.5rem)] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{part.passage.title}</h2>
              {part.passage.paragraphs?.map((para) => (
                <div key={para.label} className="mb-4">
                  <span className="font-bold text-primary mr-2">{para.label}</span>
                  <span className="leading-relaxed">{para.text}</span>
                </div>
              )) || (
                <p className="leading-relaxed whitespace-pre-line">{part.passage.content}</p>
              )}
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

          <div className="p-6 flex-1 overflow-y-auto">
            {question && (
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

                {/* Options - same style as ExamInterface */}
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

            {/* Question navigator - same style as ExamInterface */}
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
          </div>

          {/* Bottom navigation - same style as ExamInterface */}
          <div className="bg-card border-t border-border p-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
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
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Finish Modal */}
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
