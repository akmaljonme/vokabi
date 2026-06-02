import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, Loader2, Upload, ImageIcon, X } from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { toast } from 'sonner';

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
  image_url?: string | null;
}

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  testId: string;
  testSkill?: string;
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
  testSkill,
  onSave, 
  loading,
  questionCount 
}: QuestionFormDialogProps) => {
  const isAIEvaluated = testSkill === 'writing' || testSkill === 'speaking';
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple-choice',
    category: 'grammar',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 1,
    order_index: questionCount,
    image_url: '' as string | null,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        image_url: question.image_url || null,
      });
      setImagePreview(question.image_url || null);
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
        image_url: null,
      });
      setImagePreview(null);
    }
    setSelectedImage(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Faqat rasm fayllar qabul qilinadi');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Rasm hajmi 5MB dan oshmasligi kerak');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `questions/${testId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('audio').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = formData.image_url;

    if (selectedImage) {
      setUploading(true);
      try {
        imageUrl = await uploadImage(selectedImage);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Rasmni yuklashda xatolik');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // For AI-evaluated skills, use simplified data
    if (isAIEvaluated) {
      await onSave({
        ...(question ? { id: question.id } : {}),
        test_id: testId,
        question_text: formData.question_text,
        question_type: 'fill-blank',
        category: testSkill || 'writing',
        options: null,
        correct_answer: 'AI_EVALUATED',
        explanation: formData.explanation || null,
        points: formData.points,
        order_index: formData.order_index,
        image_url: imageUrl,
      });
      return;
    }

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
      image_url: imageUrl,
    });
  };

  const showOptions = formData.question_type !== 'fill-blank';
  const isTrueFalse = formData.question_type === 'true-false';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAIEvaluated 
              ? (question ? 'Topshiriqni tahrirlash' : 'Yangi topshiriq qo\'shish')
              : (question ? 'Savolni tahrirlash' : 'Yangi savol qo\'shish')
            }
          </DialogTitle>
        </DialogHeader>

        {isAIEvaluated && (
          <div className="bg-emerald-500/10 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
            🤖 {testSkill === 'writing' 
              ? 'Writing topshiriq: Talaba bu topshiriq bo\'yicha insho/matn yozadi. AI javobni baholaydi.'
              : 'Speaking savol: Talaba bu savolga ovozli javob beradi. AI javobni baholaydi.'
            }
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_text">
              {isAIEvaluated 
                ? (testSkill === 'writing' ? 'Topshiriq matni (prompt) *' : 'Savol matni *')
                : 'Savol matni *'
              }
            </Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder={isAIEvaluated 
                ? (testSkill === 'writing' 
                  ? 'Masalan: "Some people believe that technology has made our lives easier. To what extent do you agree or disagree?"'
                  : 'Masalan: "Tell me about your hometown. What do you like about it?"')
                : 'Savolni kiriting...'
              }
              rows={isAIEvaluated ? 5 : 3}
              required
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>{isAIEvaluated ? 'Topshiriq rasmi (ixtiyoriy)' : 'Savol rasmi (ixtiyoriy)'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Savol rasmi" className="max-h-40 rounded-lg border" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Rasm yuklash uchun bosing (max 5MB)</p>
              </div>
            )}
          </div>

          {/* Standard question fields - only for non-AI-evaluated */}
          {!isAIEvaluated && (
            <>
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
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!isAIEvaluated && (
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
            )}
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
            <Label htmlFor="explanation">
              {isAIEvaluated ? 'Qo\'shimcha ko\'rsatma (ixtiyoriy)' : 'Tushuntirish (ixtiyoriy)'}
            </Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder={isAIEvaluated 
                ? 'Masalan: "Kamida 250 so\'z yozing" yoki "1-2 daqiqa gapiring"'
                : 'Javob uchun tushuntirish...'
              }
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploading || !formData.question_text}
            >
              {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? 'Yuklanmoqda...' : question ? 'Saqlash' : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
