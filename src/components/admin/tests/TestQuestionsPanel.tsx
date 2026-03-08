import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  MessageSquare,
  Music
} from 'lucide-react';
import { QuestionFormDialog } from './QuestionFormDialog';
import { ReadingPassageDialog } from './ReadingPassageDialog';
import { AudioFileDialog } from './AudioFileDialog';
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
  image_url?: string | null;
}

interface ReadingPassage {
  id: string;
  test_id: string;
  title: string;
  content: string;
  paragraphs: { label: string; text: string }[] | null;
  order_index: number;
}

interface AudioFile {
  id: string;
  test_id: string;
  question_id: string | null;
  file_name: string;
  file_url: string;
  duration: number | null;
  transcript: string | null;
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
  writing: <FileText className="w-4 h-4" />,
  speaking: <Headphones className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  reading: 'bg-blue-500/10 text-blue-500',
  listening: 'bg-purple-500/10 text-purple-500',
  grammar: 'bg-green-500/10 text-green-500',
  vocabulary: 'bg-orange-500/10 text-orange-500',
  writing: 'bg-emerald-500/10 text-emerald-500',
  speaking: 'bg-rose-500/10 text-rose-500',
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
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [passagesLoading, setPassagesLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [passageDialogOpen, setPassageDialogOpen] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [deletePassageDialogOpen, setDeletePassageDialogOpen] = useState(false);
  const [passageToDelete, setPassageToDelete] = useState<ReadingPassage | null>(null);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [deleteAudioDialogOpen, setDeleteAudioDialogOpen] = useState(false);
  const [audioToDelete, setAudioToDelete] = useState<AudioFile | null>(null);

  useEffect(() => {
    fetchQuestions();
    if (test.skill === 'reading') {
      fetchPassages();
    } else {
      setPassagesLoading(false);
    }
    if (test.skill === 'listening') {
      fetchAudioFiles();
    } else {
      setAudioLoading(false);
    }
  }, [test.id]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await (supabase
        .from('questions' as any)
        .select('*')
        .eq('test_id', test.id)
        .order('order_index', { ascending: true }) as any);

      if (error) throw error;
      
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
            image_url: data.image_url || null,
          })
          .eq('id', data.id) as any);
        if (error) throw error;
        toast.success('Savol yangilandi');
      } else {
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
            image_url: data.image_url || null,
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

  // Reading passages
  const fetchPassages = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_passages')
        .select('*')
        .eq('test_id', test.id)
        .order('order_index', { ascending: true });
      if (error) throw error;
      const parsedPassages = ((data || []) as any[]).map(p => ({
        ...p,
        paragraphs: typeof p.paragraphs === 'string' ? JSON.parse(p.paragraphs) : p.paragraphs
      })) as ReadingPassage[];
      setPassages(parsedPassages);
    } catch (error) {
      console.error('Error fetching passages:', error);
      toast.error('Matnlarni yuklashda xatolik');
    } finally {
      setPassagesLoading(false);
    }
  };

  const handleSavePassage = async (data: Omit<ReadingPassage, 'id'> & { id?: string }) => {
    setSaving(true);
    try {
      if (data.id) {
        const { error } = await supabase
          .from('reading_passages')
          .update({ title: data.title, content: data.content, paragraphs: data.paragraphs, order_index: data.order_index })
          .eq('id', data.id);
        if (error) throw error;
        toast.success('Matn yangilandi');
      } else {
        const { error } = await supabase
          .from('reading_passages')
          .insert({ test_id: data.test_id, title: data.title, content: data.content, paragraphs: data.paragraphs, order_index: data.order_index });
        if (error) throw error;
        toast.success("Matn qo'shildi");
      }
      setPassageDialogOpen(false);
      setSelectedPassage(null);
      fetchPassages();
    } catch (error) {
      console.error('Error saving passage:', error);
      toast.error('Matnni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePassage = async () => {
    if (!passageToDelete) return;
    try {
      const { error } = await supabase
        .from('reading_passages')
        .delete()
        .eq('id', passageToDelete.id);
      if (error) throw error;
      toast.success("Matn o'chirildi");
      fetchPassages();
    } catch (error) {
      console.error('Error deleting passage:', error);
      toast.error("Matnni o'chirishda xatolik");
    } finally {
      setDeletePassageDialogOpen(false);
      setPassageToDelete(null);
    }
  };

  // Audio files
  const fetchAudioFiles = async () => {
    try {
      const { data, error } = await (supabase
        .from('audio_files' as any)
        .select('*')
        .eq('test_id', test.id)
        .order('order_index', { ascending: true }) as any);
      if (error) throw error;
      setAudioFiles((data as AudioFile[]) || []);
    } catch (error) {
      console.error('Error fetching audio files:', error);
      toast.error('Audio fayllarni yuklashda xatolik');
    } finally {
      setAudioLoading(false);
    }
  };

  const handleSaveAudio = async (data: any) => {
    setSaving(true);
    try {
      if (data.id) {
        const { error } = await (supabase
          .from('audio_files' as any)
          .update({
            file_name: data.file_name,
            file_url: data.file_url,
            duration: data.duration,
            transcript: data.transcript,
            order_index: data.order_index ?? 0,
          })
          .eq('id', data.id) as any);
        if (error) throw error;
        toast.success('Audio yangilandi');
      } else {
        const { error } = await (supabase
          .from('audio_files' as any)
          .insert({
            test_id: data.test_id,
            file_name: data.file_name,
            file_url: data.file_url,
            duration: data.duration,
            transcript: data.transcript,
            order_index: data.order_index ?? 0,
          }) as any);
        if (error) throw error;
        toast.success("Audio qo'shildi");
      }
      setAudioDialogOpen(false);
      setSelectedAudio(null);
      fetchAudioFiles();
    } catch (error) {
      console.error('Error saving audio:', error);
      toast.error('Audioni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAudio = async () => {
    if (!audioToDelete) return;
    try {
      // Delete from storage if possible
      try {
        const url = new URL(audioToDelete.file_url);
        const path = url.pathname.split('/storage/v1/object/public/audio/')[1];
        if (path) {
          await supabase.storage.from('audio').remove([path]);
        }
      } catch {}

      const { error } = await (supabase
        .from('audio_files' as any)
        .delete()
        .eq('id', audioToDelete.id) as any);
      if (error) throw error;
      toast.success("Audio o'chirildi");
      fetchAudioFiles();
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error("Audioni o'chirishda xatolik");
    } finally {
      setDeleteAudioDialogOpen(false);
      setAudioToDelete(null);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const hasMediaTab = test.skill === 'reading' || test.skill === 'listening';
  const isAIEvaluated = test.skill === 'writing' || test.skill === 'speaking';

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
              {isAIEvaluated && (
                <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                  🤖 AI baholaydi
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {questions.length} ta {isAIEvaluated ? 'topshiriq' : 'savol'}
                {!isAIEvaluated && ` • ${totalPoints} ball`}
                {test.skill === 'reading' && ` • ${passages.length} ta matn`}
                {test.skill === 'listening' && ` • ${audioFiles.length} ta audio`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {test.skill === 'reading' && (
            <Button variant="outline" onClick={() => { setSelectedPassage(null); setPassageDialogOpen(true); }}>
              <BookOpen className="w-4 h-4 mr-2" />
              Matn qo'shish
            </Button>
          )}
          {test.skill === 'listening' && (
            <Button variant="outline" onClick={() => { setSelectedAudio(null); setAudioDialogOpen(true); }}>
              <Music className="w-4 h-4 mr-2" />
              Audio qo'shish
            </Button>
          )}
          <Button onClick={() => { setSelectedQuestion(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {isAIEvaluated ? 'Topshiriq qo\'shish' : 'Savol qo\'shish'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {hasMediaTab ? (
        <Tabs defaultValue={test.skill === 'reading' ? 'passages' : 'audio'} className="w-full">
          <TabsList>
            {test.skill === 'reading' && (
              <TabsTrigger value="passages">
                <BookOpen className="w-4 h-4 mr-2" />
                Matnlar ({passages.length})
              </TabsTrigger>
            )}
            {test.skill === 'listening' && (
              <TabsTrigger value="audio">
                <Headphones className="w-4 h-4 mr-2" />
                Audiolar ({audioFiles.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="questions">
              <FileText className="w-4 h-4 mr-2" />
              Savollar ({questions.length})
            </TabsTrigger>
          </TabsList>

          {test.skill === 'reading' && (
            <TabsContent value="passages" className="mt-4">
              {renderPassagesList()}
            </TabsContent>
          )}

          {test.skill === 'listening' && (
            <TabsContent value="audio" className="mt-4">
              {renderAudioList()}
            </TabsContent>
          )}

          <TabsContent value="questions" className="mt-4">
            {renderQuestionsList()}
          </TabsContent>
        </Tabs>
      ) : (
        renderQuestionsList()
      )}

      {/* Reading Passage Dialog */}
      <ReadingPassageDialog
        open={passageDialogOpen}
        onOpenChange={setPassageDialogOpen}
        passage={selectedPassage}
        testId={test.id}
        onSave={handleSavePassage}
        loading={saving}
        passageCount={passages.length}
      />

      {/* Audio File Dialog */}
      <AudioFileDialog
        open={audioDialogOpen}
        onOpenChange={setAudioDialogOpen}
        audioFile={selectedAudio}
        testId={test.id}
        onSave={handleSaveAudio}
        loading={saving}
        audioCount={audioFiles.length}
      />

      {/* Delete Passage Confirmation */}
      <AlertDialog open={deletePassageDialogOpen} onOpenChange={setDeletePassageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Matnni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{passageToDelete?.title}" matnini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePassage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Audio Confirmation */}
      <AlertDialog open={deleteAudioDialogOpen} onOpenChange={setDeleteAudioDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Audioni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{audioToDelete?.file_name}" audio faylini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAudio} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Form Dialog */}
      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={selectedQuestion}
        testId={test.id}
        testSkill={test.skill}
        onSave={handleSaveQuestion}
        loading={saving}
        questionCount={questions.length}
      />

      {/* Delete Question Confirmation */}
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

  function renderPassagesList() {
    if (passagesLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (passages.length === 0) {
      return (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Matnlar yo'q</h3>
            <p className="text-sm mb-4">Ushbu testga hali reading matn qo'shilmagan</p>
            <Button onClick={() => setPassageDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Birinchi matnni qo'shing
            </Button>
          </div>
        </Card>
      );
    }
    return (
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-3 pr-4">
          {passages.map((passage, index) => (
            <Card key={passage.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-3">
                <div className="flex items-center text-muted-foreground cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">#{index + 1}</span>
                        <h3 className="font-medium">{passage.title}</h3>
                        {passage.paragraphs && (
                          <Badge variant="secondary" className="text-xs">
                            {passage.paragraphs.length} paragraf
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{passage.content}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedPassage(passage); setPassageDialogOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setPassageToDelete(passage); setDeletePassageDialogOpen(true); }} className="text-destructive hover:text-destructive">
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
    );
  }

  function renderAudioList() {
    if (audioLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (audioFiles.length === 0) {
      return (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <Headphones className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Audiolar yo'q</h3>
            <p className="text-sm mb-4">Ushbu testga hali audio fayl qo'shilmagan</p>
            <Button onClick={() => setAudioDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Birinchi audioni qo'shing
            </Button>
          </div>
        </Card>
      );
    }
    return (
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-3 pr-4">
          {audioFiles.map((audio, index) => (
            <Card key={audio.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-3">
                <div className="flex items-center text-muted-foreground">
                  <Music className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Part {audio.order_index + 1}
                        </Badge>
                        <h3 className="font-medium">{audio.file_name}</h3>
                        {audio.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.floor(audio.duration / 60)}:{String(audio.duration % 60).padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                      <audio controls className="w-full max-w-md h-8">
                        <source src={audio.file_url} />
                      </audio>
                      {audio.transcript && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{audio.transcript}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedAudio(audio); setAudioDialogOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setAudioToDelete(audio); setDeleteAudioDialogOpen(true); }} className="text-destructive hover:text-destructive">
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
    );
  }

  function renderQuestionsList() {
    return loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">{isAIEvaluated ? 'Topshiriqlar yo\'q' : 'Savollar yo\'q'}</h3>
            <p className="text-sm mb-4">
              {isAIEvaluated 
                ? `Ushbu testga hali topshiriq qo'shilmagan. ${test.skill === 'writing' ? 'Writing uchun 2 ta task (prompt) qo\'shing.' : 'Speaking uchun 5 ta savol qo\'shing.'} AI talabalar javobini baholaydi.`
                : 'Ushbu testga hali savol qo\'shilmagan'
              }
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {isAIEvaluated ? 'Birinchi topshiriqni qo\'shing' : 'Birinchi savolni qo\'shing'}
            </Button>
          </div>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-350px)]">
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
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedQuestion(question); setDialogOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setQuestionToDelete(question); setDeleteDialogOpen(true); }} className="text-destructive hover:text-destructive">
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
      );
  }
};
