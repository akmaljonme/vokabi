import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, UserPlus, X, Users } from 'lucide-react';

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
}

interface AssignedUser {
  id: string;
  user_id: string;
  assigned_at: string;
  profile?: { full_name: string | null };
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
}

export const ExamsTab = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [examForm, setExamForm] = useState({
    title: '', description: '', skill: 'reading', level: 'A1',
    time_limit: 1800, max_attempts: 1, is_active: true,
  });

  const skillLabels: Record<string, string> = {
    vocabulary: "Lug'at", grammar: 'Grammatika', reading: 'Reading',
    listening: 'Listening', writing: 'Writing',
  };

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.title.trim()) return;
    try {
      if (editingExam) {
        const { error } = await supabase.from('exams').update(examForm).eq('id', editingExam.id);
        if (error) throw error;
        toast.success('Exam yangilandi');
      } else {
        const { error } = await supabase.from('exams').insert(examForm);
        if (error) throw error;
        toast.success('Exam yaratildi');
      }
      setShowExamDialog(false);
      setEditingExam(null);
      setExamForm({ title: '', description: '', skill: 'reading', level: 'A1', time_limit: 1800, max_attempts: 1, is_active: true });
      fetchExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Bu examni o'chirishni tasdiqlaysizmi?")) return;
    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      toast.success("Exam o'chirildi");
      fetchExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchAssignedUsers = async (exam: Exam) => {
    setSelectedExam(exam);
    setSearchQuery('');
    setSearchResults([]);
    try {
      const { data, error } = await supabase
        .from('exam_user_assignments')
        .select('id, user_id, assigned_at')
        .eq('exam_id', exam.id);
      if (error) throw error;

      const users = await Promise.all(
        (data || []).map(async (a) => {
          const { data: profile } = await supabase
            .from('profiles').select('full_name')
            .eq('user_id', a.user_id).maybeSingle();
          return { ...a, profile };
        })
      );
      setAssignedUsers(users);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const { data, error } = await supabase
        .from('profiles').select('user_id, full_name')
        .ilike('full_name', `%${query}%`).limit(10);
      if (error) throw error;
      // Filter out already assigned users
      const assignedIds = assignedUsers.map(a => a.user_id);
      setSearchResults((data || []).filter(p => !assignedIds.includes(p.user_id)));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!selectedExam) return;
    try {
      const { error } = await supabase.from('exam_user_assignments').insert({
        exam_id: selectedExam.id, user_id: userId,
      });
      if (error) throw error;
      toast.success("Foydalanuvchi tayinlandi");
      setSearchQuery('');
      setSearchResults([]);
      fetchAssignedUsers(selectedExam);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveUser = async (assignmentId: string) => {
    try {
      const { error } = await supabase.from('exam_user_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
      toast.success("Foydalanuvchi olib tashlandi");
      if (selectedExam) fetchAssignedUsers(selectedExam);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Examlar Boshqaruvi</h2>
        <Dialog open={showExamDialog} onOpenChange={(open) => {
          setShowExamDialog(open);
          if (!open) {
            setEditingExam(null);
            setExamForm({ title: '', description: '', skill: 'reading', level: 'A1', time_limit: 1800, max_attempts: 1, is_active: true });
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Yangi Exam</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExam ? 'Examni Tahrirlash' : 'Yangi Exam Yaratish'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nomi</Label><Input value={examForm.title} onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Tavsif</Label><Textarea value={examForm.description} onChange={e => setExamForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Turi</Label>
                  <Select value={examForm.skill} onValueChange={v => setExamForm(p => ({ ...p, skill: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(skillLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Daraja</Label>
                  <Select value={examForm.level} onValueChange={v => setExamForm(p => ({ ...p, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Vaqt (soniya)</Label><Input type="number" value={examForm.time_limit} onChange={e => setExamForm(p => ({ ...p, time_limit: parseInt(e.target.value) || 1800 }))} /></div>
                <div><Label>Max urinishlar</Label><Input type="number" value={examForm.max_attempts} onChange={e => setExamForm(p => ({ ...p, max_attempts: parseInt(e.target.value) || 1 }))} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={examForm.is_active} onCheckedChange={v => setExamForm(p => ({ ...p, is_active: v }))} />
                <Label>Faol</Label>
              </div>
              <Button onClick={handleCreateExam} className="w-full">{editingExam ? 'Yangilash' : 'Yaratish'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {exams.map(exam => (
          <Card key={exam.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <h3 className="font-semibold">{exam.title}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{skillLabels[exam.skill] || exam.skill}</Badge>
                  <Badge variant="outline">{exam.level}</Badge>
                  <Badge variant={exam.is_active ? 'default' : 'destructive'}>
                    {exam.is_active ? 'Faol' : 'Nofaol'}
                  </Badge>
                  <Badge variant="outline">{exam.max_attempts} urinish</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => fetchAssignedUsers(exam)}>
                      <UserPlus className="w-4 h-4 mr-1" />Foydalanuvchilar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{exam.title} - Tayinlangan foydalanuvchilar</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Input
                          placeholder="Ism bo'yicha qidiring..."
                          value={searchQuery}
                          onChange={e => handleSearchUsers(e.target.value)}
                        />
                        {searchResults.length > 0 && (
                          <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                            {searchResults.map(user => (
                              <div
                                key={user.user_id}
                                className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                onClick={() => handleAssignUser(user.user_id)}
                              >
                                <span className="text-sm">{user.full_name || 'Nomsiz'}</span>
                                <Plus className="w-4 h-4 text-primary" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {assignedUsers.map(au => (
                          <div key={au.id} className="flex items-center justify-between p-2 rounded border">
                            <span className="text-sm">{au.profile?.full_name || au.user_id.slice(0, 8)}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveUser(au.id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {assignedUsers.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">Tayinlangan foydalanuvchilar yo'q</p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditingExam(exam);
                  setExamForm({
                    title: exam.title, description: exam.description || '',
                    skill: exam.skill, level: exam.level,
                    time_limit: exam.time_limit, max_attempts: exam.max_attempts,
                    is_active: exam.is_active,
                  });
                  setShowExamDialog(true);
                }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {exams.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Hali exam yaratilmagan
          </div>
        )}
      </div>
    </div>
  );
};
