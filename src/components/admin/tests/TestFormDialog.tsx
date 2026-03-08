import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string | null;
  level: string;
  skill: string;
  time_limit: number;
  is_active: boolean;
  randomize_questions: boolean;
  book_number?: number | null;
  unit_number?: number | null;
}

interface TestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test | null;
  onSave: (data: Omit<Test, 'id'> & { id?: string }) => Promise<void>;
  loading: boolean;
}

const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
const skills = ['reading', 'listening', 'grammar', 'vocabulary', 'speaking', 'writing'];

export const TestFormDialog = ({ open, onOpenChange, test, onSave, loading }: TestFormDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'A1',
    skill: 'reading',
    time_limit: 30,
    is_active: true,
    randomize_questions: false,
    book_number: null as number | null,
    unit_number: null as number | null,
  });

  useEffect(() => {
    if (test) {
      setFormData({
        title: test.title,
        description: test.description || '',
        level: test.level,
        skill: test.skill,
        time_limit: test.time_limit / 60, // Convert seconds to minutes for display
        is_active: test.is_active,
        randomize_questions: test.randomize_questions,
        book_number: test.book_number || null,
        unit_number: test.unit_number || null,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        level: 'A1',
        skill: 'reading',
        time_limit: 30,
        is_active: true,
        randomize_questions: false,
        book_number: null,
        unit_number: null,
      });
    }
  }, [test, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...(test ? { id: test.id } : {}),
      title: formData.title,
      description: formData.description || null,
      level: formData.level,
      skill: formData.skill,
      time_limit: formData.time_limit * 60, // Convert minutes to seconds for storage
      is_active: formData.is_active,
      randomize_questions: formData.randomize_questions,
      book_number: formData.skill === 'vocabulary' ? formData.book_number : null,
      unit_number: formData.skill === 'vocabulary' ? formData.unit_number : null,
    } as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{test ? 'Testni tahrirlash' : 'Yangi test yaratish'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Test nomi *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Reading Comprehension Mock 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tavsif</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Test haqida qisqacha ma'lumot..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Daraja *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill">Ko'nikma *</Label>
              <Select
                value={formData.skill}
                onValueChange={(value) => setFormData({ ...formData, skill: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

           <div className="space-y-2">
             <Label htmlFor="time_limit">Vaqt chegarasi (daqiqalarda) *</Label>
             <Input
               id="time_limit"
               type="number"
               min={5}
               max={180}
               value={formData.time_limit}
               onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || 30 })}
             />
           </div>

           {formData.skill === 'vocabulary' && (
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="book_number">Kitob raqami *</Label>
                 <Input
                   id="book_number"
                   type="number"
                   min={1}
                   max={6}
                   value={formData.book_number || ''}
                   onChange={(e) => setFormData({ ...formData, book_number: parseInt(e.target.value) || null })}
                   placeholder="1-6 orasida"
                   required={formData.skill === 'vocabulary'}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="unit_number">Unit raqami *</Label>
                 <Input
                   id="unit_number"
                   type="number"
                   min={1}
                   max={30}
                   value={formData.unit_number || ''}
                   onChange={(e) => setFormData({ ...formData, unit_number: parseInt(e.target.value) || null })}
                   placeholder="1-30 orasida"
                   required={formData.skill === 'vocabulary'}
                 />
               </div>
             </div>
           )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Faol</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="randomize"
                checked={formData.randomize_questions}
                onCheckedChange={(checked) => setFormData({ ...formData, randomize_questions: checked })}
              />
              <Label htmlFor="randomize">Savollarni aralashtirish</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.title || (formData.skill === 'vocabulary' && (!formData.book_number || !formData.unit_number))}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {test ? 'Saqlash' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
