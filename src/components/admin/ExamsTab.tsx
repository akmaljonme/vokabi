import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff, UserPlus, Search, ClipboardList, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AIExamGenerateDialog } from './tests/AIExamGenerateDialog';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  skill: string;
  level: string;
  time_limit: number;
  max_attempts: number;
  is_active: boolean;
  created_at: string;
  question_count?: number;
  assigned_count?: number;
}

interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

const skills = [
  { value: 'reading', label: 'Reading', emoji: '📖' },
  { value: 'listening', label: 'Listening', emoji: '🎧' },
  { value: 'grammar', label: 'Grammar', emoji: '📝' },
];
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const ExamsTab = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skill, setSkill] = useState('grammar');
  const [level, setLevel] = useState('B1');
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);

  // Assign state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Question form state
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('multiple-choice');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qPoints, setQPoints] = useState(1);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await (supabase.from('exams' as any).select('*').order('created_at', { ascending: false }) as any);
      if (error) throw error;

      const withCounts = await Promise.all(
        ((data || []) as Exam[]).map(async (exam) => {
          const { count: qCount } = await (supabase.from('exam_questions' as any).select('*', { count: 'exact', head: true }).eq('exam_id', exam.id) as any);
          const { count: aCount } = await (supabase.from('exam_user_assignments' as any).select('*', { count: 'exact', head: true }).eq('exam_id', exam.id) as any);
          return { ...exam, question_count: qCount || 0, assigned_count: aCount || 0 };
        })
      );
      setExams(withCounts);
    } catch (e) {
      console.error(e);
      toast.error("Examlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const openForm = (exam?: Exam) => {
    if (exam) {
      setSelectedExam(exam);
      setTitle(exam.title);
      setDescription(exam.description || '');
      setSkill(exam.skill);
      setLevel(exam.level);
      setTimeLimit(exam.time_limit / 60);
      setMaxAttempts(exam.max_attempts);
    } else {
      setSelectedExam(null);
      setTitle(''); setDescription(''); setSkill('grammar'); setLevel('B1');
      setTimeLimit(30); setMaxAttempts(1);
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Sarlavha kiriting"); return; }
    setSaving(true);
    try {
      const payload = {
        title, description: description || null, skill, level,
        time_limit: timeLimit * 60, max_attempts: maxAttempts,
        is_active: selectedExam?.is_active ?? false,
      };
      if (selectedExam) {
        const { error } = await (supabase.from('exams' as any).update(payload).eq('id', selectedExam.id) as any);
        if (error) throw error;
        toast.success("Exam yangilandi");
      } else {
        const { error } = await (supabase.from('exams' as any).insert(payload) as any);
        if (error) throw error;
        toast.success("Yangi exam yaratildi");
      }
      setFormOpen(false);
      fetchExams();
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    try {
      const { error } = await (supabase.from('exams' as any).delete().eq('id', examToDelete.id) as any);
      if (error) throw error;
      toast.success("Exam o'chirildi");
      fetchExams();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteOpen(false);
      setExamToDelete(null);
    }
  };

  const toggleActive = async (exam: Exam) => {
    try {
      const { error } = await (supabase.from('exams' as any).update({ is_active: !exam.is_active }).eq('id', exam.id) as any);
      if (error) throw error;
      toast.success(exam.is_active ? "Exam yopildi" : "Exam ochildi");
      fetchExams();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // === Assign users ===
  const openAssign = async (exam: Exam) => {
    setSelectedExam(exam);
    setSearchQuery('');
    setSearchResults([]);
    setAssignOpen(true);
    // Load assigned users
    const { data } = await (supabase.from('exam_user_assignments' as any).select('user_id').eq('exam_id', exam.id) as any);
    const userIds = (data || []).map((d: any) => d.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await (supabase.from('profiles' as any).select('user_id, full_name, username').in('user_id', userIds) as any);
      setAssignedUsers(profiles || []);
    } else {
      setAssignedUsers([]);
    }
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await (supabase.from('profiles' as any).select('user_id, full_name, username').or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).limit(10) as any);
    setSearchResults(data || []);
    setSearching(false);
  };

  const assignUser = async (userId: string) => {
    if (!selectedExam) return;
    try {
      const { error } = await (supabase.from('exam_user_assignments' as any).insert({ exam_id: selectedExam.id, user_id: userId }) as any);
      if (error) {
        if (error.code === '23505') { toast.info("Bu foydalanuvchi allaqachon tayinlangan"); return; }
        throw error;
      }
      toast.success("Foydalanuvchi tayinlandi");
      openAssign(selectedExam);
      fetchExams();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const unassignUser = async (userId: string) => {
    if (!selectedExam) return;
    await (supabase.from('exam_user_assignments' as any).delete().eq('exam_id', selectedExam.id).eq('user_id', userId) as any);
    toast.success("Foydalanuvchi olib tashlandi");
    openAssign(selectedExam);
    fetchExams();
  };

  // === Questions ===
  const openQuestions = async (exam: Exam) => {
    setSelectedExam(exam);
    const { data } = await (supabase.from('exam_questions' as any).select('*').eq('exam_id', exam.id).order('order_index') as any);
    setQuestions(data || []);
    setQuestionsOpen(true);
  };

  const openQuestionForm = (q?: ExamQuestion) => {
    if (q) {
      setEditingQuestion(q);
      setQText(q.question_text);
      setQType(q.question_type);
      setQOptions(Array.isArray(q.options) ? q.options : ['', '', '', '']);
      setQCorrect(q.correct_answer);
      setQExplanation(q.explanation || '');
      setQPoints(q.points);
    } else {
      setEditingQuestion(null);
      setQText(''); setQType('multiple-choice'); setQOptions(['', '', '', '']);
      setQCorrect(''); setQExplanation(''); setQPoints(1);
    }
    setQuestionFormOpen(true);
  };

  const saveQuestion = async () => {
    if (!selectedExam || !qText.trim() || !qCorrect.trim()) { toast.error("To'ldiring"); return; }
    setSaving(true);
    try {
      const payload = {
        exam_id: selectedExam.id,
        question_text: qText,
        question_type: qType,
        options: qType === 'multiple-choice' ? qOptions.filter(Boolean) : null,
        correct_answer: qCorrect,
        explanation: qExplanation || null,
        points: qPoints,
        order_index: editingQuestion ? editingQuestion.order_index : questions.length + 1,
      };
      if (editingQuestion) {
        const { error } = await (supabase.from('exam_questions' as any).update(payload).eq('id', editingQuestion.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('exam_questions' as any).insert(payload) as any);
        if (error) throw error;
      }
      toast.success("Savol saqlandi");
      setQuestionFormOpen(false);
      openQuestions(selectedExam);
      fetchExams();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (qId: string) => {
    await (supabase.from('exam_questions' as any).delete().eq('id', qId) as any);
    if (selectedExam) openQuestions(selectedExam);
    fetchExams();
  };

  const skillColors: Record<string, string> = {
    reading: 'bg-blue-500/10 text-blue-500',
    listening: 'bg-purple-500/10 text-purple-500',
    grammar: 'bg-green-500/10 text-green-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exam boshqaruvi</h2>
          <p className="text-muted-foreground">Maxsus examlar yarating va foydalanuvchilarga tayinlang</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4 mr-2" /> Yangi exam
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : exams.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Examlar topilmadi</h3>
          <Button onClick={() => openForm()}><Plus className="w-4 h-4 mr-2" /> Birinchi examni yarating</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className={`p-4 ${!exam.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{exam.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${skillColors[exam.skill] || ''}`}>
                      {exam.skill}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{exam.level}</Badge>
                    <span className="text-xs text-muted-foreground">{exam.question_count} savol</span>
                  </div>
                </div>
                <Badge variant={exam.is_active ? 'default' : 'secondary'} className="text-xs">
                  {exam.is_active ? 'Ochiq' : 'Yopiq'}
                </Badge>
              </div>

              {exam.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{exam.description}</p>}

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{exam.time_limit / 60} daqiqa</span>
                <span>{exam.max_attempts} urinish</span>
                <span>{exam.assigned_count} talaba</span>
              </div>

              <div className="flex gap-1 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={() => openQuestions(exam)}>
                  <ClipboardList className="w-4 h-4 mr-1" /> Savollar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openAssign(exam)}>
                  <UserPlus className="w-4 h-4 mr-1" /> Tayinlash
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(exam)}>
                  {exam.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(exam)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setExamToDelete(exam); setDeleteOpen(true); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Exam Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedExam ? 'Examni tahrirlash' : 'Yangi exam'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sarlavha *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam sarlavhasi" />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ko'nikma *</Label>
                <Select value={skill} onValueChange={setSkill}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {skills.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Daraja *</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vaqt (daqiqa)</Label>
                <Input type="number" min={5} max={180} value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)} />
              </div>
              <div className="space-y-2">
                <Label>Max urinishlar</Label>
                <Input type="number" min={1} max={10} value={maxAttempts} onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Bekor</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Examni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{examToDelete?.title}" examini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">O'chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Users Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Foydalanuvchilarni tayinlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ism yoki username bo'yicha qidiring..."
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => assignUser(u.user_id)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-sm"
                  >
                    <span>{u.full_name || u.username || 'Nomsiz'}</span>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Tayinlangan ({assignedUsers.length})</Label>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {assignedUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-sm">
                    <span>{u.full_name || u.username || 'Nomsiz'}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => unassignUser(u.user_id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Questions Dialog */}
      <Dialog open={questionsOpen} onOpenChange={setQuestionsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Savollar — {selectedExam?.title}</span>
              <Button size="sm" onClick={() => openQuestionForm()}>
                <Plus className="w-4 h-4 mr-1" /> Savol qo'shish
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {questions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Savollar yo'q</p>
            ) : questions.map((q, i) => (
              <Card key={q.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{i + 1}. {q.question_text}</p>
                    {Array.isArray(q.options) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {q.options.map((opt: string, oi: number) => (
                          <Badge key={oi} variant={opt === q.correct_answer ? 'default' : 'outline'} className="text-xs">
                            {opt}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Javob: {q.correct_answer} | {q.points} ball</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openQuestionForm(q)}><Edit className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteQuestion(q.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Form Dialog */}
      <Dialog open={questionFormOpen} onOpenChange={setQuestionFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Savolni tahrirlash' : 'Yangi savol'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Savol matni *</Label>
              <Textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select value={qType} onValueChange={setQType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="fill-blank">Fill in blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ball</Label>
                <Input type="number" min={1} max={10} value={qPoints} onChange={(e) => setQPoints(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            {qType === 'multiple-choice' && (
              <div className="space-y-2">
                <Label>Variantlar</Label>
                {qOptions.map((opt, i) => (
                  <Input key={i} value={opt} onChange={(e) => {
                    const newOpts = [...qOptions];
                    newOpts[i] = e.target.value;
                    setQOptions(newOpts);
                  }} placeholder={`Variant ${String.fromCharCode(65 + i)}`} />
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>To'g'ri javob *</Label>
              <Input value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Izoh</Label>
              <Textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionFormOpen(false)}>Bekor</Button>
            <Button onClick={saveQuestion} disabled={saving}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
