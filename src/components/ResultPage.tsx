import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Target, Trophy, RotateCcw, Save } from 'lucide-react';
import { TestResult } from '@/types/cefr';
import { generateMockTest } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useTestResults } from '@/hooks/useTestResults';

interface ResultPageProps {
  result: TestResult;
  onRetry: () => void;
  onBack: () => void;
}

export const ResultPage = ({ result, onRetry, onBack }: ResultPageProps) => {
  const mockTest = generateMockTest(result.mockId, result.level, result.skill);
  const { user } = useAuth();
  const { saveResult } = useTestResults();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const save = async () => {
      if (user && !saved) {
        setSaving(true);
        await saveResult(result);
        setSaved(true);
        setSaving(false);
      }
    };
    save();
  }, [user, result, saved]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = () => {
    if (result.percentage >= 90) return { grade: 'A+', color: 'text-emerald-500' };
    if (result.percentage >= 80) return { grade: 'A', color: 'text-emerald-500' };
    if (result.percentage >= 70) return { grade: 'B', color: 'text-blue-500' };
    if (result.percentage >= 60) return { grade: 'C', color: 'text-amber-500' };
    if (result.percentage >= 50) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  };

  const gradeInfo = getGrade();

  return (
    <div className="min-h-screen bg-muted/30 py-8 animate-fade-in">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tests
        </button>

        {/* Result Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${result.passed ? 'bg-emerald-100' : 'bg-red-100'} mb-4`}>
            {result.passed ? (
              <Trophy className="w-12 h-12 text-emerald-500" />
            ) : (
              <Target className="w-12 h-12 text-red-500" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {result.passed 
              ? `You have passed the ${result.level} ${result.skill} test!`
              : `You need more practice for ${result.level} level.`
            }
          </p>
          
          {user && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              {saving ? (
                <span className="text-muted-foreground">Saving result...</span>
              ) : saved ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Save className="w-4 h-4" />
                  Result saved to your account
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          <div className="card-elevated text-center">
            <div className={`text-4xl font-display font-bold mb-2 ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </div>
            <p className="text-sm text-muted-foreground">Grade</p>
          </div>
          <div className="card-elevated text-center">
            <div className="text-4xl font-display font-bold text-primary mb-2">
              {result.percentage}%
            </div>
            <p className="text-sm text-muted-foreground">Score</p>
          </div>
          <div className="card-elevated text-center">
            <div className="text-4xl font-display font-bold text-foreground mb-2">
              {result.correctAnswers}/{result.totalQuestions}
            </div>
            <p className="text-sm text-muted-foreground">Correct</p>
          </div>
          <div className="card-elevated text-center">
            <div className="text-4xl font-display font-bold text-foreground mb-2 flex items-center justify-center gap-1">
              <Clock className="w-6 h-6" />
              {formatTime(result.timeTaken)}
            </div>
            <p className="text-sm text-muted-foreground">Time Taken</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your Score</span>
            <span className="font-semibold">{result.percentage}% (Pass: 70%)</span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${result.passed ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${result.percentage}%` }}
            />
            <div 
              className="absolute top-0 h-full w-0.5 bg-foreground/50"
              style={{ left: '70%' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button onClick={onRetry} className="btn-primary flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Retry This Test
          </button>
          <button onClick={onBack} className="btn-outline">
            Choose Another Test
          </button>
        </div>

        {/* Detailed Review */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold mb-6 text-center">
            Review Your Answers
          </h2>

          {mockTest.parts.map((part) => (
            <div key={part.id} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                  Part {part.id}
                </span>
                {part.passage.title}
              </h3>

              <div className="space-y-3">
                {part.questions.map((question) => {
                  const answer = result.answers.find((a) => a.questionId === question.id);
                  const isCorrect = answer?.isCorrect || false;

                  return (
                    <div 
                      key={question.id}
                      className={`p-4 rounded-xl border-2 ${
                        isCorrect 
                          ? 'border-emerald-200 bg-emerald-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-muted-foreground">
                              Q{question.id}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'
                            }`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{question.question}</p>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="text-muted-foreground">Your answer: </span>
                              <span className={isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                                {Array.isArray(answer?.userAnswer) 
                                  ? answer?.userAnswer.join(', ') || '(No answer)'
                                  : answer?.userAnswer || '(No answer)'
                                }
                              </span>
                            </p>
                            {!isCorrect && (
                              <p>
                                <span className="text-muted-foreground">Correct answer: </span>
                                <span className="text-emerald-600 font-medium">
                                  {Array.isArray(question.correctAnswer)
                                    ? question.correctAnswer.join(', ')
                                    : question.correctAnswer
                                  }
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
