import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Clock, Flag, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { MockTest, UserAnswer, Part, TestResult, Question } from '@/types/cefr';
import { generateMockTest } from '@/data/mockData';
import { useTestWithQuestions } from '@/hooks/useTests';
import { CEFRLevel, SkillType } from '@/types/cefr';
import AudioPlayer from '@/components/AudioPlayer';

interface TestInterfaceProps {
  level: CEFRLevel;
  skill: SkillType;
  mockId: number;
  testId?: string | null;
  onFinish: (result: TestResult) => void;
  onBack: () => void;
}

export const TestInterface = ({ level, skill, mockId, testId, onFinish, onBack }: TestInterfaceProps) => {
  const [mockTest, setMockTest] = useState<MockTest | null>(null);
  const [currentPart, setCurrentPart] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Fetch from database if testId is provided
  const { test: dbTest, loading: dbLoading } = useTestWithQuestions(testId);

  useEffect(() => {
    // If we have a database test, use it
    if (testId && dbTest) {
      setMockTest(dbTest);
      setTimeLeft(dbTest.timeLimit);
    } else if (!testId) {
      // Fallback to mock data if no testId
      const test = generateMockTest(mockId, level, skill);
      setMockTest(test);
      setTimeLeft(test.timeLimit);
    }
  }, [mockId, level, skill, testId, dbTest]);

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

  const getQuestionNumber = (): number => {
    return (currentPart - 1) * 10 + currentQuestion;
  };

  const isQuestionAnswered = (partId: number, questionIndex: number): boolean => {
    const questionId = (partId - 1) * 10 + questionIndex + 1;
    return answers.some((a) => a.questionId === questionId);
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

  const handleOptionClick = (option: string) => {
    const question = getCurrentQuestionInPart();
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
  const question = getCurrentQuestionInPart();

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{level}</span>
                <span className="text-muted-foreground">•</span>
                <span className="capitalize">{skill}</span>
                <span className="text-muted-foreground">•</span>
                <span>Mock {mockId}</span>
              </div>
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
              <span className="hidden sm:inline">Finish Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* Part Tabs */}
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
        <div className={`flex-1 flex flex-col ${skill === 'listening' ? 'lg:max-w-4xl lg:mx-auto' : ''}`}>
          {/* Listening Controls */}
          {skill === 'listening' && part && (
            <div className="bg-card border-b border-border p-4">
              <div className="max-w-2xl mx-auto space-y-4">
                <AudioPlayer 
                  text={part.passage.content}
                  label={`Part ${currentPart} Audio`}
                  showTranscript={true}
                />
              </div>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto">
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Question {getQuestionNumber()} of 40
                </span>
                <span className="text-sm text-muted-foreground capitalize">
                  {question?.type.replace(/-/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{part?.instruction}</p>
              <h3 className="text-lg font-semibold">{question?.question}</h3>
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
                Select exactly 2 options
              </p>
            )}

            {/* Horizontal Question Navigator */}
            <div className="bg-muted/50 rounded-xl p-4 mt-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Part {currentPart} Questions</h4>
                <span className="text-xs text-muted-foreground">
                  {getCurrentPart()?.questions.filter((_, i) => isQuestionAnswered(currentPart, i)).length}/10 answered
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => {
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
                })}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 bg-card border-t border-border flex items-center justify-between">
            <button 
              onClick={() => handleNavigate('prev')}
              disabled={currentPart === 1 && currentQuestion === 1}
              className="btn-outline py-2 px-4 flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-sm text-muted-foreground">
              {answers.length}/40 answered
            </div>

            <button 
              onClick={() => handleNavigate('next')}
              disabled={currentPart === 4 && currentQuestion === 10}
              className="btn-primary py-2 px-4 flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Finish Modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-xl font-display font-bold mb-2">Finish Test?</h3>
            <p className="text-muted-foreground mb-4">
              You have answered {answers.length} out of 40 questions.
              {answers.length < 40 && ` ${40 - answers.length} questions are unanswered.`}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmFinish(false)}
                className="btn-outline flex-1"
              >
                Continue Test
              </button>
              <button 
                onClick={handleFinishTest}
                className="btn-primary flex-1"
              >
                Finish & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
