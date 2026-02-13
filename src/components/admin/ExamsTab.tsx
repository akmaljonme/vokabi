import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Trash2, Users, FileText, Settings, Edit, UserPlus, X } from 'lucide-react';

interface ExamGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  memberCount?: number;
}

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

interface GroupMember {
  id: string;
  user_id: string;
  added_at: string;
  profile?: { full_name: string | null; };
}

export const ExamsTab = () => {
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ExamGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [examForm, setExamForm] = useState({
    title: '', description: '', skill: 'reading', level: 'A1',
    time_limit: 1800, max_attempts: 1, is_active: true,
  });
  const [examPermissions, setExamPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, examsRes] = await Promise.all([
        supabase.from('exam_groups').select('*').order('created_at', { ascending: false }),
        supabase.from('exams').select('*').order('created_at', { ascending: false }),
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (examsRes.error) throw examsRes.error;

      // Get member counts
      const groupsWithCounts = await Promise.all(
        (groupsRes.data || []).map(async (g) => {
          const { count } = await supabase
            .from('exam_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id);
          return { ...g, memberCount: count || 0 };
        })
      );

      setGroups(groupsWithCounts);
      setExams(examsRes.data || []);

      // Fetch permissions
      const { data: perms } = await supabase.from('exam_group_permissions').select('*');
      const permMap: Record<string, string[]> = {};
      (perms || []).forEach((p: any) => {
        if (!permMap[p.exam_id]) permMap[p.exam_id] = [];
        permMap[p.exam_id].push(p.group_id);
      });
      setExamPermissions(permMap);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return;
    try {
      const { error } = await supabase.from('exam_groups').insert({
        name: groupForm.name, description: groupForm.description || null,
      });
      if (error) throw error;
      toast.success('Guruh yaratildi');
      setShowGroupDialog(false);
      setGroupForm({ name: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Bu guruhni o'chirishni tasdiqlaysizmi?")) return;
    try {
      const { error } = await supabase.from('exam_groups').delete().eq('id', id);
      if (error) throw error;
      toast.success("Guruh o'chirildi");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTogglePermission = async (examId: string, groupId: string) => {
    const currentPerms = examPermissions[examId] || [];
    const hasPermission = currentPerms.includes(groupId);
    try {
      if (hasPermission) {
        const { error } = await supabase.from('exam_group_permissions')
          .delete().eq('exam_id', examId).eq('group_id', groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('exam_group_permissions')
          .insert({ exam_id: examId, group_id: groupId });
        if (error) throw error;
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchGroupMembers = async (group: ExamGroup) => {
    setSelectedGroup(group);
    try {
      const { data, error } = await supabase
        .from('exam_group_members')
        .select('id, user_id, added_at')
        .eq('group_id', group.id);
      if (error) throw error;

      // Fetch profiles for members
      const members = await Promise.all(
        (data || []).map(async (m) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', m.user_id)
            .maybeSingle();
          return { ...m, profile };
        })
      );
      setGroupMembers(members);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !selectedGroup) return;
    try {
      // Find user by email via profiles - we need to search auth users
      // Since we can't query auth.users directly, we'll use the user_id approach
      // Admin needs to enter user_id or we search profiles
      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${newMemberEmail}%`);
      
      if (searchError) throw searchError;
      if (!profiles || profiles.length === 0) {
        toast.error("Foydalanuvchi topilmadi");
        return;
      }

      const { error } = await supabase.from('exam_group_members').insert({
        group_id: selectedGroup.id, user_id: profiles[0].user_id,
      });
      if (error) throw error;
      toast.success("Foydalanuvchi qo'shildi");
      setNewMemberEmail('');
      fetchGroupMembers(selectedGroup);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from('exam_group_members').delete().eq('id', memberId);
      if (error) throw error;
      toast.success("Foydalanuvchi olib tashlandi");
      if (selectedGroup) fetchGroupMembers(selectedGroup);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const skillLabels: Record<string, string> = {
    vocabulary: "Lug'at", grammar: 'Grammatika', reading: 'Reading',
    listening: 'Listening', writing: 'Writing',
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Examlar Boshqaruvi</h2>
      </div>

      <Tabs defaultValue="exams">
        <TabsList>
          <TabsTrigger value="exams">Examlar</TabsTrigger>
          <TabsTrigger value="groups">Guruhlar</TabsTrigger>
          <TabsTrigger value="permissions">Ruxsatlar</TabsTrigger>
        </TabsList>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-end">
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
                  <div className="flex items-center gap-4">
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
                  </div>
                  <div className="flex gap-2">
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
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Yangi Guruh</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yangi Guruh</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nomi</Label><Input value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Tavsif</Label><Textarea value={groupForm.description} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))} /></div>
                  <Button onClick={handleCreateGroup} className="w-full">Yaratish</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {groups.map(group => (
              <Card key={group.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Users className="w-3 h-3 mr-1" />{group.memberCount} a'zo
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => fetchGroupMembers(group)}>
                          <UserPlus className="w-4 h-4 mr-1" />A'zolar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{group.name} - A'zolar</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Ism bo'yicha qidiring..."
                              value={newMemberEmail}
                              onChange={e => setNewMemberEmail(e.target.value)}
                            />
                            <Button onClick={handleAddMember} size="sm"><Plus className="w-4 h-4" /></Button>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {groupMembers.map(member => (
                              <div key={member.id} className="flex items-center justify-between p-2 rounded border">
                                <span className="text-sm">{member.profile?.full_name || member.user_id.slice(0, 8)}</span>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            {groupMembers.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">A'zolar yo'q</p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {groups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Hali guruh yaratilmagan
              </div>
            )}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          {exams.length === 0 || groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Avval exam va guruh yarating
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b font-semibold">Exam</th>
                    {groups.map(g => (
                      <th key={g.id} className="p-3 border-b font-semibold text-center">{g.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => (
                    <tr key={exam.id} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">{exam.title}</div>
                        <div className="text-xs text-muted-foreground">{skillLabels[exam.skill]} • {exam.level}</div>
                      </td>
                      {groups.map(g => (
                        <td key={g.id} className="p-3 text-center">
                          <Switch
                            checked={(examPermissions[exam.id] || []).includes(g.id)}
                            onCheckedChange={() => handleTogglePermission(exam.id, g.id)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
