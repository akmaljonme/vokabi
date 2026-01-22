import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  GripVertical, 
  CheckCircle2,
  Loader2,
  FileText,
  Headphones,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { QuestionFormDialog } from './QuestionFormDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Test {
  id: string;
  title: string;
  description: string | null;
  level: string;
  skill: string;
  time_limit: number;
  is_active: boolean;
  randomize_questions: boolean;
}

interface Question {
  id: string;
  test_id: string | null;
  question_text: string;
  question_type: string;
  category: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

interface TestQuestionsPanelProps {
  test: Test;
  onBack: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  reading: <FileText className="w-4 h-4" />,
  listening: <Headphones className="w-4 h-4" />,
  grammar: <BookOpen className="w-4 h-4" />,
  vocabulary: <MessageSquare className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  reading: 'bg-blue-500/10 text-blue-500',
  listening: 'bg-purple-500/10 text-purple-500',
  grammar: 'bg-green-500/10 text-green-500',
  vocabulary: 'bg-orange-500/10 text-orange-500',
};

const typeLabels: Record<string, string> = {
  'multiple-choice': "Ko'p tanlov",
  'true-false': "To'g'ri/Noto'g'ri",
  'fill-blank': "Bo'sh joy",
  'matching-headings': 'Sarlavhalar',
  'matching-paragraph': 'Paragraflar',
  'matching-features': 'Xususiyatlar',
};

export const TestQuestionsPanel = ({ test, onBack }: TestQuestionsPanelProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [test.id]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await (supabase
        .from('questions' as any)
        .select('*')
        .eq('test_id', test.id)
        .order('order_index', { ascending: true }) as any);

      if (error) throw error;
      
      // Parse options from JSON if needed
      const parsedQuestions = ((data as any[]) || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      })) as Question[];
      
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Savollarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (data: Omit<Question, 'id'> & { id?: string }) => {
    setSaving(true);
    try {
      if (data.id) {
        // Update existing question
        const { error } = await (supabase
          .from('questions' as any)
          .update({
            question_text: data.question_text,
            question_type: data.question_type,
            category: data.category,
            options: data.options,
            correct_answer: data.correct_answer,
            explanation: data.explanation,
            points: data.points,
            order_index: data.order_index,
          })
          .eq('id', data.id) as any);

        if (error) throw error;
        toast.success('Savol yangilandi');
      } else {
        // Create new question
        const { error } = await (supabase
          .from('questions' as any)
          .insert({
            test_id: data.test_id,
            question_text: data.question_text,
            question_type: data.question_type,
            category: data.category,
            options: data.options,
            correct_answer: data.correct_answer,
            explanation: data.explanation,
            points: data.points,
            order_index: data.order_index,
          }) as any);

        if (error) throw error;
        toast.success("Savol qo'shildi");
      }

      setDialogOpen(false);
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Savolni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      const { error } = await (supabase
        .from('questions' as any)
        .delete()
        .eq('id', questionToDelete.id) as any);

      if (error) throw error;
      toast.success("Savol o'chirildi");
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error("Savolni o'chirishda xatolik");
    } finally {
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const openEditDialog = (question: Question) => {
    setSelectedQuestion(question);
    setDialogOpen(true);
  };

  const openDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{test.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{test.level}</Badge>
              <Badge variant="secondary">{test.skill}</Badge>
              <span className="text-sm text-muted-foreground">
                {questions.length} ta savol • {totalPoints} ball
              </span>
            </div>
          </div>
        </div>
        <Button onClick={() => { setSelectedQuestion(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Savol qo'shish
        </Button>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Savollar yo'q</h3>
            <p className="text-sm mb-4">Ushbu testga hali savol qo'shilmagan</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Birinchi savolni qo'shing
            </Button>
          </div>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-3 pr-4">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  <div className="flex items-center text-muted-foreground cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">#{index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[question.question_type] || question.question_type}
                          </Badge>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${categoryColors[question.category]}`}>
                            {categoryIcons[question.category]}
                            <span className="capitalize">{question.category}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {question.points} ball
                          </Badge>
                        </div>
                        
                        <p className="text-sm line-clamp-2">{question.question_text}</p>
                        
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {question.options.slice(0, 4).map((opt, i) => (
                              <span 
                                key={i} 
                                className={`text-xs px-2 py-1 rounded ${
                                  opt === question.correct_answer 
                                    ? 'bg-green-500/10 text-green-600 font-medium' 
                                    : 'bg-muted'
                                }`}
                              >
                                {opt === question.correct_answer && (
                                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                )}
                                {String.fromCharCode(65 + i)}. {opt.length > 30 ? opt.slice(0, 30) + '...' : opt}
                              </span>
                            ))}
                            {question.options.length > 4 && (
                              <span className="text-xs text-muted-foreground">
                                +{question.options.length - 4} ta
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(question)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(question)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Question Form Dialog */}
      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={selectedQuestion}
        testId={test.id}
        onSave={handleSaveQuestion}
        loading={saving}
        questionCount={questions.length}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Savolni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Ushbu savolni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
