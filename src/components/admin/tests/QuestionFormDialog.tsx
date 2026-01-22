import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, Loader2 } from 'lucide-react';

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

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  testId: string;
  onSave: (data: Omit<Question, 'id'> & { id?: string }) => Promise<void>;
  loading: boolean;
  questionCount: number;
}

const questionTypes = [
  { value: 'multiple-choice', label: "Ko'p tanlov" },
  { value: 'true-false', label: "To'g'ri/Noto'g'ri" },
  { value: 'fill-blank', label: "Bo'sh joyni to'ldiring" },
  { value: 'matching-headings', label: 'Sarlavhalarni moslashtirish' },
  { value: 'matching-paragraph', label: "Paragraflarni moslashtirish" },
  { value: 'matching-features', label: "Xususiyatlarni moslashtirish" },
];

const categories = [
  { value: 'grammar', label: 'Grammatika' },
  { value: 'vocabulary', label: "Lug'at" },
  { value: 'reading', label: "O'qish" },
  { value: 'listening', label: 'Tinglash' },
];

export const QuestionFormDialog = ({ 
  open, 
  onOpenChange, 
  question, 
  testId, 
  onSave, 
  loading,
  questionCount 
}: QuestionFormDialogProps) => {
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple-choice',
    category: 'grammar',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 1,
    order_index: questionCount,
  });

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text,
        question_type: question.question_type,
        category: question.category,
        options: Array.isArray(question.options) ? question.options : ['', '', '', ''],
        correct_answer: question.correct_answer,
        explanation: question.explanation || '',
        points: question.points,
        order_index: question.order_index,
      });
    } else {
      setFormData({
        question_text: '',
        question_type: 'multiple-choice',
        category: 'grammar',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        points: 1,
        order_index: questionCount,
      });
    }
  }, [question, open, questionCount]);

  // Update options when question type changes
  useEffect(() => {
    if (formData.question_type === 'true-false') {
      setFormData(prev => ({
        ...prev,
        options: ["To'g'ri", "Noto'g'ri"],
        correct_answer: prev.correct_answer || "To'g'ri"
      }));
    } else if (formData.question_type === 'fill-blank') {
      setFormData(prev => ({
        ...prev,
        options: [],
      }));
    } else if (formData.options.length < 2) {
      setFormData(prev => ({
        ...prev,
        options: ['', '', '', ''],
      }));
    }
  }, [formData.question_type]);

  const handleAddOption = () => {
    if (formData.options.length < 8) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions,
        correct_answer: prev.correct_answer === prev.options[index] ? '' : prev.correct_answer
      }));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions,
      correct_answer: prev.correct_answer === oldValue ? value : prev.correct_answer
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredOptions = formData.question_type === 'fill-blank' 
      ? null 
      : formData.options.filter(opt => opt.trim() !== '');
    
    await onSave({
      ...(question ? { id: question.id } : {}),
      test_id: testId,
      question_text: formData.question_text,
      question_type: formData.question_type,
      category: formData.category,
      options: filteredOptions,
      correct_answer: formData.correct_answer,
      explanation: formData.explanation || null,
      points: formData.points,
      order_index: formData.order_index,
    });
  };

  const showOptions = formData.question_type !== 'fill-blank';
  const isTrueFalse = formData.question_type === 'true-false';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Savolni tahrirlash' : 'Yangi savol qo\'shish'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_text">Savol matni *</Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Savolni kiriting..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Savol turi *</Label>
              <Select
                value={formData.question_type}
                onValueChange={(value) => setFormData({ ...formData, question_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kategoriya *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showOptions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Javob variantlari *</Label>
                {!isTrueFalse && formData.options.length < 8 && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                    <Plus className="w-3 h-3 mr-1" />
                    Variant qo'shish
                  </Button>
                )}
              </div>
              
              <RadioGroup
                value={formData.correct_answer}
                onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                className="space-y-2"
              >
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${index}`}
                      disabled={!option.trim()}
                    />
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Variant ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                      disabled={isTrueFalse}
                    />
                    {!isTrueFalse && formData.options.length > 2 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                To'g'ri javobni tanlash uchun radio tugmasini bosing
              </p>
            </div>
          )}

          {formData.question_type === 'fill-blank' && (
            <div className="space-y-2">
              <Label htmlFor="correct_answer">To'g'ri javob *</Label>
              <Input
                id="correct_answer"
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                placeholder="To'g'ri javobni kiriting..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Savol matnida bo'sh joyni ___ bilan belgilang
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Ball</Label>
              <Input
                id="points"
                type="number"
                min={1}
                max={10}
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_index">Tartib raqami</Label>
              <Input
                id="order_index"
                type="number"
                min={0}
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Tushuntirish (ixtiyoriy)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Javob uchun tushuntirish..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.question_text || (!formData.correct_answer && formData.question_type !== 'fill-blank')}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {question ? 'Saqlash' : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
