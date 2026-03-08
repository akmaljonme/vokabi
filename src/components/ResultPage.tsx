import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Target, Trophy, RotateCcw, Save, FileDown } from 'lucide-react';
import { CertificateDownload } from '@/components/CertificateDownload';
import { VideoRecommendations } from '@/components/AIResultsSection';
import { AIResultDisplay } from '@/components/AIResultDisplay';
import { TestResult } from '@/types/cefr';
import { generateMockTest } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useTestResults } from '@/hooks/useTestResults';
import { useSubscription } from '@/hooks/useSubscription';
import { generateTestPDF, generateResultPDF } from '@/utils/pdfGenerator';
import { motion } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';

interface ResultPageProps {
  result: TestResult;
  onRetry: () => void;
  onBack: () => void;
}

export const ResultPage = ({ result, onRetry, onBack }: ResultPageProps) => {
  const isAISkill = result.skill === 'writing' || result.skill === 'speaking';
  
  // For Writing/Speaking, show AI result display
  if (isAISkill) {
    return <AIResultDisplay result={result} onRetry={onRetry} onBack={onBack} />;
  }

  return <StandardResultPage result={result} onRetry={onRetry} onBack={onBack} />;
};

const StandardResultPage = ({ result, onRetry, onBack }: ResultPageProps) => {
  const mockTest = result.mockTest || generateMockTest(result.mockId, result.level, result.skill);
  const { user } = useAuth();
  const { saveResult } = useTestResults();
  const { isPro } = useSubscription();
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
    return { grade: 'F', color: 'text-destructive' };
  };

  const gradeInfo = getGrade();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Testlarga qaytish
        </motion.button>

        {/* Result Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${result.passed ? 'bg-emerald-500/10' : 'bg-destructive/10'} mb-5`}
          >
            {result.passed ? (
              <Trophy className="w-10 h-10 text-emerald-500" />
            ) : (
              <Target className="w-10 h-10 text-destructive" />
            )}
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 tracking-tight">
            {result.passed ? 'Tabriklaymiz!' : 'Mashq qiling!'}
          </h1>
          <p className="text-muted-foreground">
            {result.passed
              ? `${result.level} ${result.skill} testidan muvaffaqiyatli o'tdingiz!`
              : `${result.level} darajasida ko'proq mashq qiling.`}
          </p>

          {user && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs">
              {saving ? (
                <span className="text-muted-foreground">Saqlanmoqda...</span>
              ) : saved ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Save className="w-3 h-3" /> Natija saqlandi
                </span>
              ) : null}
            </div>
          )}
        </motion.div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-12">
          {[
            { value: gradeInfo.grade, label: 'Baho', color: gradeInfo.color },
            { value: `${result.percentage}%`, label: 'Natija', color: 'text-primary' },
            { value: `${result.correctAnswers}/${result.totalQuestions}`, label: 'To\'g\'ri', color: 'text-foreground' },
            { value: formatTime(result.timeTaken), label: 'Vaqt', color: 'text-foreground', icon: Clock },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="card-elevated text-center p-5"
            >
              <div className={`text-3xl font-display font-bold mb-1 ${card.color} flex items-center justify-center gap-1`}>
                {card.icon && <card.icon className="w-5 h-5" />}
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-xl mx-auto mb-12"
        >
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Natija</span>
            <span className="font-medium">{result.percentage}% (O'tish: 70%)</span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.percentage}%` }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute left-0 top-0 h-full rounded-full ${result.passed ? 'bg-emerald-500' : 'bg-destructive'}`}
            />
            <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: '70%' }} />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
        >
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onRetry} className="btn-primary flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> Qayta ishlash
          </motion.button>
          {isPro ? (
            <CertificateDownload result={result} />
          ) : (
            <div className="relative group">
              <button disabled className="btn-outline flex items-center gap-2 text-sm opacity-50 cursor-not-allowed">
                <Lock className="w-4 h-4" /> Sertifikat
                <Crown className="w-3 h-3 text-amber-500" />
              </button>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Pro versiya kerak
              </div>
            </div>
          )}
          <button onClick={() => generateTestPDF(mockTest)} className="btn-outline flex items-center gap-2 text-sm">
            <FileDown className="w-4 h-4" /> Test PDF
          </button>
          <button onClick={() => generateResultPDF(result, mockTest)} className="btn-outline flex items-center gap-2 text-sm">
            <FileDown className="w-4 h-4" /> Natijalar PDF
          </button>
          <button onClick={onBack} className="btn-outline text-sm">Boshqa test</button>
        </motion.div>

        {/* AI Video Recommendations - Pro Only */}
        {result.percentage < 100 && isPro && (
          <div className="max-w-4xl mx-auto mb-8">
            <VideoRecommendations
              wrongQuestions={result.answers
                .filter(a => !a.isCorrect)
                .map(a => {
                  const q = mockTest.parts.flatMap(p => p.questions).find(q => q.id === a.questionId);
                  return { question: q?.question || '', correct: a.correctAnswer, userAnswer: a.userAnswer };
                })}
              level={result.level}
              skill={result.skill}
            />
          </div>
        )}

        {/* Pro Upsell Banner */}
        {!isPro && result.percentage < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="max-w-2xl mx-auto mb-8 p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center"
          >
            <Crown className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg mb-2">Pro versiyaga o'ting</h3>
            <p className="text-sm text-muted-foreground mb-1">
              AI tahlil, video tavsiyalar, sertifikat yuklab olish va cheksiz testlar
            </p>
            <p className="text-xs text-muted-foreground">Admin bilan bog'laning Pro olish uchun</p>
          </motion.div>
        )}

        {/* Detailed Review */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-display font-bold mb-6 text-center tracking-tight">
            Javoblarni ko'rib chiqish
          </h2>

          {mockTest.parts.map((part) => (
            <div key={part.id} className="mb-8">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span className="premium-badge text-xs">Part {part.id}</span>
                <span className="text-muted-foreground">{part.passage.title}</span>
              </h3>

              <div className="space-y-2">
                {part.questions.map((question) => {
                  const answer = result.answers.find((a) => a.questionId === question.id);
                  const isCorrect = answer?.isCorrect || false;

                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-xl border ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                          : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-muted-foreground text-xs">Q{question.id}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              isCorrect ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {isCorrect ? 'To\'g\'ri' : 'Noto\'g\'ri'}
                            </span>
                          </div>
                          <p className="mb-1.5">{question.question}</p>
                          <div className="space-y-0.5 text-xs">
                            <p>
                              <span className="text-muted-foreground">Sizning javob: </span>
                              <span className={isCorrect ? 'text-emerald-600' : 'text-destructive'}>
                                {Array.isArray(answer?.userAnswer) ? answer?.userAnswer.join(', ') || '(Javob berilmagan)' : answer?.userAnswer || '(Javob berilmagan)'}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p>
                                <span className="text-muted-foreground">To'g'ri javob: </span>
                                <span className="text-emerald-600 font-medium">
                                  {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
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
