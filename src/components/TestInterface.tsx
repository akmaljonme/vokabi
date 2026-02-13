import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Clock, Flag, AlertCircle, Eye, EyeOff, Maximize } from 'lucide-react';
import { MockTest, UserAnswer, Part, TestResult, Question } from '@/types/cefr';
import { generateMockTest } from '@/data/mockData';
import { useTestWithQuestions } from '@/hooks/useTests';
import { CEFRLevel, SkillType } from '@/types/cefr';
import { PartAudioPlayer } from '@/components/PartAudioPlayer';

interface TestInterfaceProps {
  level: CEFRLevel;
  skill: SkillType;
  mockId: number;
  testId?: string | null;
  onFinish: (result: TestResult) => void;
  onBack: () => void;
}

export const TestInterface = ({ level, skill, mockId, testId, onFinish, onBack }: TestInterfaceProps) => {
  const testStorageKey = `test_progress_${testId || `${level}_${skill}_${mockId}`}`;

  const [mockTest, setMockTest] = useState<MockTest | null>(null);
  const [currentPart, setCurrentPart] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isNoParts = skill === 'vocabulary' || skill === 'grammar';

  // Fetch from database if testId is provided
  const { test: dbTest, loading: dbLoading } = useTestWithQuestions(testId);

  // Load saved progress from localStorage
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
      // Only set timeLeft from test if no saved progress
      const saved = localStorage.getItem(testStorageKey);
      if (!saved) setTimeLeft(dbTest.timeLimit);
    } else if (!testId) {
      const test = generateMockTest(mockId, level, skill);
      setMockTest(test);
      const saved = localStorage.getItem(testStorageKey);
      if (!saved) setTimeLeft(test.timeLimit);
    }
  }, [mockId, level, skill, testId, dbTest, testStorageKey]);

  // Fullscreen + prevent exit
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (containerRef.current && document.fullscreenElement === null) {
          await containerRef.current.requestFullscreen();
        }
      } catch (e) {
        // Fullscreen not supported or denied
      }
    };
    enterFullscreen();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Test hali tugamagan. Chiqishni xohlaysizmi?';
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && mockTest) {
        // Re-enter fullscreen if exited during test
        try {
          containerRef.current?.requestFullscreen();
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [mockTest]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save progress to localStorage
  useEffect(() => {
    if (!mockTest) return;
    const data = { answers, currentPart, currentQuestion, timeLeft };
    localStorage.setItem(testStorageKey, JSON.stringify(data));
  }, [answers, currentPart, currentQuestion, timeLeft, testStorageKey, mockTest]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPart = (): Part | undefined => {
    return mockTest?.parts.find((p) => p.id === currentPart);
  };

  const getCurrentQuestionInPart = (): Question | undefined => {
    const part = getCurrentPart();
    return part?.questions[currentQuestion - 1];
  };


  const getAnswer = (questionId: number): string | string[] | undefined => {
    const answer = answers.find((a) => a.questionId === questionId);
    return answer?.answer;
  };

  const setAnswer = (answer: string | string[]) => {
    const questionId = getQuestionNumber();
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      const newAnswer: UserAnswer = {
        questionId,
        partId: currentPart,
        answer,
      };
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
    if (isNoParts) {
      return mockTest.parts.reduce((acc, part) => acc + part.questions.length, 0);
    }
    return mockTest.parts.reduce((acc, part) => acc + part.questions.length, 0);
  };

  const getQuestionNumber = (): number => {
    if (isNoParts) {
      return currentQuestion;
    }
    return (currentPart - 1) * 10 + currentQuestion;
  };

  const isQuestionAnswered = (partId: number, questionIndex: number): boolean => {
    if (isNoParts) {
      return answers.some((a) => a.questionId === questionIndex + 1);
    }
    const questionId = (partId - 1) * 10 + questionIndex + 1;
    return answers.some((a) => a.questionId === questionId);
  };

  const getCurrentQuestionForNoParts = (): Question | undefined => {
    if (!mockTest) return undefined;
    const allQuestions = mockTest.parts.flatMap(p => p.questions);
    return allQuestions[currentQuestion - 1];
  };

  const handleOptionClick = (option: string) => {
    const question = isNoParts ? getCurrentQuestionForNoParts() : getCurrentQuestionInPart();
    if (!question) return;

    if (question.type === 'list-selection') {
      const currentAnswer = getAnswer(getQuestionNumber()) as string[] | undefined;
      const current = currentAnswer || [];
      if (current.includes(option)) {
        setAnswer(current.filter((o) => o !== option));
      } else if (current.length < 2) {
        setAnswer([...current, option]);
      }
    } else {
      setAnswer(option);
    }
  };

  const isOptionSelected = (option: string): boolean => {
    const answer = getAnswer(getQuestionNumber());
    if (Array.isArray(answer)) {
      return answer.includes(option);
    }
    return answer === option;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const total = getTotalQuestions();
    if (isNoParts) {
      if (direction === 'next' && currentQuestion < total) {
        setCurrentQuestion(prev => prev + 1);
      } else if (direction === 'prev' && currentQuestion > 1) {
        setCurrentQuestion(prev => prev - 1);
      }
    } else {
      if (direction === 'next') {
        if (currentQuestion < 10) {
          setCurrentQuestion((prev) => prev + 1);
        } else if (currentPart < 4) {
          setCurrentPart((prev) => prev + 1);
          setCurrentQuestion(1);
        }
      } else {
        if (currentQuestion > 1) {
          setCurrentQuestion((prev) => prev - 1);
        } else if (currentPart > 1) {
          setCurrentPart((prev) => prev - 1);
          setCurrentQuestion(10);
        }
      }
    }
  };

  const handlePartChange = (partId: number) => {
    setCurrentPart(partId);
    setCurrentQuestion(1);
  };

  const handleQuestionNav = (questionIndex: number) => {
    setCurrentQuestion(questionIndex + 1);
  };

  const handleFinishTest = () => {
    if (!mockTest) return;
    // Clear saved progress
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
      mockId,
      level,
      skill,
      totalQuestions,
      correctAnswers: correctCount,
      percentage,
      passed: percentage >= 70,
      answers: results,
      timeTaken: mockTest.timeLimit - timeLeft,
    });
  };

  if (!mockTest || (testId && dbLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const part = getCurrentPart();
  const question = isNoParts ? getCurrentQuestionForNoParts() : getCurrentQuestionInPart();
  const totalQ = getTotalQuestions();

  const handleExitTest = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onBack();
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-muted/30 flex flex-col animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">{level}</span>
              <span className="text-muted-foreground">•</span>
              <span className="capitalize">{skill}</span>
            </div>

            <div className={`timer-display flex items-center gap-2 ${timeLeft < 300 ? 'timer-warning' : ''}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>

            <button 
              onClick={() => setShowConfirmFinish(true)}
              className="btn-primary py-2 px-4 flex items-center gap-2"
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Tugatish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Part Tabs - only for reading/listening */}
      {!isNoParts && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex">
              {mockTest.parts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePartChange(p.id)}
                  className={`part-tab ${currentPart === p.id ? 'active' : ''}`}
                >
                  Part {p.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Passage (Reading only) */}
        {skill === 'reading' && (
          <div className="lg:w-1/2 bg-card border-r border-border">
            <div className="p-6 h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] flex flex-col">
              <h2 className="text-xl font-display font-bold mb-4">{part?.passage.title}</h2>
              <div className="passage-container flex-1 overflow-y-auto">
                {part?.passage.paragraphs?.map((para) => (
                  <div key={para.label} className="mb-4">
                    <span className="font-bold text-primary mr-2">{para.label}</span>
                    <span className="text-foreground/90 leading-relaxed">{para.text}</span>
                  </div>
                )) || (
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                    {part?.passage.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Questions */}
        <div className={`flex-1 flex flex-col ${skill === 'listening' ? 'lg:max-w-4xl lg:mx-auto' : ''} ${isNoParts ? 'max-w-3xl mx-auto w-full' : ''}`}>
          {/* Listening Controls */}
          {skill === 'listening' && part && (
            <div className="bg-card border-b border-border p-4">
              <div className="max-w-2xl mx-auto space-y-4">
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
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Savol {getQuestionNumber()} / {totalQ}
                </span>
                <span className="text-sm text-muted-foreground capitalize">
                  {question?.type.replace(/-/g, ' ')}
                </span>
              </div>
              {!isNoParts && <p className="text-sm text-muted-foreground mb-4">{part?.instruction}</p>}
              <h3 className="text-lg font-semibold">{question?.question}</h3>
              {question?.imageUrl && (
                <div className="mt-3">
                  <img 
                    src={question.imageUrl} 
                    alt="Savol rasmi" 
                    className="max-h-64 rounded-lg border border-border object-contain"
                  />
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {question?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className={`question-option ${isOptionSelected(option) ? 'selected' : ''}`}
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted mr-3 font-semibold text-sm">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {question?.type === 'list-selection' && (
              <p className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                2 ta javobni tanlang
              </p>
            )}

            {/* Question Navigator */}
            <div className="bg-muted/50 rounded-xl p-4 mt-auto">
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
                        className={`test-nav-item ${isAnswered ? 'answered' : 'unanswered'} ${isCurrent ? 'current' : ''}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })
                ) : (
                  Array.from({ length: 10 }, (_, i) => {
                    const isAnswered = isQuestionAnswered(currentPart, i);
                    const isCurrent = i + 1 === currentQuestion;
                    return (
                      <button
                        key={i}
                        onClick={() => handleQuestionNav(i)}
                        className={`test-nav-item ${isAnswered ? 'answered' : 'unanswered'} ${isCurrent ? 'current' : ''}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 bg-card border-t border-border flex items-center justify-between">
            <button 
              onClick={() => handleNavigate('prev')}
              disabled={isNoParts ? currentQuestion === 1 : (currentPart === 1 && currentQuestion === 1)}
              className="btn-outline py-2 px-4 flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Oldingi
            </button>

            <div className="text-sm text-muted-foreground">
              {answers.length}/{totalQ} javob
            </div>

            <button 
              onClick={() => handleNavigate('next')}
              disabled={isNoParts ? currentQuestion === totalQ : (currentPart === 4 && currentQuestion === 10)}
              className="btn-primary py-2 px-4 flex items-center gap-2"
            >
              Keyingi
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Finish Modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-xl font-display font-bold mb-2">Testni tugataysizmi?</h3>
            <p className="text-muted-foreground mb-4">
              Siz {answers.length} ta savolga javob berdingiz ({totalQ} tadan).
              {answers.length < totalQ && ` ${totalQ - answers.length} ta savol javobsiz qoldi.`}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmFinish(false)}
                className="btn-outline flex-1"
              >
                Davom etish
              </button>
              <button 
                onClick={() => {
                  handleFinishTest();
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="btn-primary flex-1"
              >
                Tugatish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
