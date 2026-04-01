import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, FileText, Headphones, BookOpen, MessageSquare, Search, Loader2, Eye, EyeOff, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TestFormDialog } from './tests/TestFormDialog';
import { TestQuestionsPanel } from './tests/TestQuestionsPanel';
import { PDFImportDialog } from './tests/PDFImportDialog';
import { AITestGenerateDialog } from './tests/AITestGenerateDialog';
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
  created_at: string;
  question_count?: number;
  book_number?: number | null;
  unit_number?: number | null;
}

const skillIcons: Record<string, React.ReactNode> = {
  reading: <FileText className="w-5 h-5" />,
  listening: <Headphones className="w-5 h-5" />,
  grammar: <BookOpen className="w-5 h-5" />,
  vocabulary: <MessageSquare className="w-5 h-5" />,
};

const skillColors: Record<string, string> = {
  reading: 'bg-blue-500/10 text-blue-500',
  listening: 'bg-purple-500/10 text-purple-500',
  grammar: 'bg-green-500/10 text-green-500',
  vocabulary: 'bg-orange-500/10 text-orange-500',
};

export const TestsTab = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [viewingTest, setViewingTest] = useState<Test | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      // Use type assertion since types.ts hasn't been regenerated yet
      const { data: testsData, error: testsError } = await (supabase
        .from('tests' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (testsError) throw testsError;

      // Fetch question counts for each test
      const testsWithCounts = await Promise.all(
        ((testsData as Test[]) || []).map(async (test) => {
          const { count } = await (supabase
            .from('questions' as any)
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.id) as any);
          return { ...test, question_count: count || 0 };
        })
      );

      setTests(testsWithCounts);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Testlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = async (data: Omit<Test, 'id' | 'created_at'> & { id?: string }) => {
    setSaving(true);
    try {
      if (data.id) {
        // Update existing test
        const { error } = await (supabase
          .from('tests' as any)
          .update({
            title: data.title,
            description: data.description,
            level: data.level,
            skill: data.skill,
            time_limit: data.time_limit,
            is_active: data.is_active,
            randomize_questions: data.randomize_questions,
            book_number: data.book_number,
            unit_number: data.unit_number,
          })
          .eq('id', data.id) as any);

        if (error) throw error;
        toast.success('Test yangilandi');
      } else {
        // Create new test
        const { error } = await (supabase
          .from('tests' as any)
          .insert({
            title: data.title,
            description: data.description,
            level: data.level,
            skill: data.skill,
            time_limit: data.time_limit,
            is_active: data.is_active,
            randomize_questions: data.randomize_questions,
            book_number: data.book_number,
            unit_number: data.unit_number,
          }) as any);

        if (error) throw error;
        toast.success('Yangi test yaratildi');
      }

      setDialogOpen(false);
      setSelectedTest(null);
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error('Testni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!testToDelete) return;

    try {
      const { error } = await (supabase
        .from('tests' as any)
        .delete()
        .eq('id', testToDelete.id) as any);

      if (error) throw error;
      toast.success("Test o'chirildi");
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error("Testni o'chirishda xatolik");
    } finally {
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    }
  };

  const toggleTestStatus = async (test: Test) => {
    try {
      const { error } = await (supabase
        .from('tests' as any)
        .update({ is_active: !test.is_active })
        .eq('id', test.id) as any);

      if (error) throw error;
      toast.success(test.is_active ? 'Test nofaol qilindi' : 'Test faollashtirildi');
      fetchTests();
    } catch (error) {
      console.error('Error toggling test status:', error);
      toast.error("Statusni o'zgartirishda xatolik");
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesLevel = !selectedLevel || test.level === selectedLevel;
    const matchesSearch = !searchQuery || 
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.skill.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // If viewing a test's questions, show the questions panel
  if (viewingTest) {
    return (
      <TestQuestionsPanel 
        test={viewingTest} 
        onBack={() => setViewingTest(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Testlar boshqaruvi</h2>
          <p className="text-muted-foreground">Mock testlarni yarating va boshqaring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPdfDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            PDF dan import
          </Button>
          <Button onClick={() => { setSelectedTest(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Yangi test
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Testlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedLevel(null)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              !selectedLevel
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            Hammasi
          </button>
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                selectedLevel === level
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTests.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Testlar topilmadi</h3>
            <p className="text-sm mb-4">
              {searchQuery || selectedLevel 
                ? 'Qidiruv natijasi bo\'yicha test topilmadi' 
                : 'Hali test yaratilmagan'}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Birinchi testni yarating
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <Card 
              key={test.id} 
              className={`p-4 hover:shadow-lg transition-all cursor-pointer ${
                !test.is_active ? 'opacity-60' : ''
              }`}
              onClick={() => setViewingTest(test)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${skillColors[test.skill]}`}>
                    {skillIcons[test.skill]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{test.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{test.level}</Badge>
                      {test.skill === 'vocabulary' && test.book_number && (
                        <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-200">
                          Kitob {test.book_number}
                        </Badge>
                      )}
                      {test.unit_number && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">
                          Unit {test.unit_number}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {test.question_count} ta savol
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={test.is_active ? 'default' : 'secondary'} className="text-xs">
                  {test.is_active ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
              
              {test.description && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {test.description}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {test.time_limit / 60} daqiqa
                </span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => toggleTestStatus(test)}
                  >
                    {test.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => { setSelectedTest(test); setDialogOpen(true); }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { setTestToDelete(test); setDeleteDialogOpen(true); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Add New Card */}
          <Card 
            className="p-4 border-dashed flex items-center justify-center min-h-[180px] cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setDialogOpen(true)}
          >
            <div className="text-center">
              <Plus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Yangi test qo'shish</p>
            </div>
          </Card>
        </div>
      )}

      {/* Test Form Dialog */}
      <TestFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        test={selectedTest}
        onSave={handleSaveTest}
        loading={saving}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Testni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{testToDelete?.title}" testini o'chirishni xohlaysizmi? 
              Barcha bog'liq savollar ham o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Import Dialog */}
      <PDFImportDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        onSuccess={fetchTests}
      />
    </div>
  );
};
