import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Brain, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIExamGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
const skills = [
  { value: 'grammar', label: 'Grammar', emoji: '📝' },
  { value: 'reading', label: 'Reading', emoji: '📖' },
  { value: 'listening', label: 'Listening', emoji: '🎧' },
];

const promptExamples: Record<string, string[]> = {
  grammar: [
    "Present Perfect va Past Simple farqi",
    "Conditional sentences (If clauses)",
    "Passive voice mashqlari",
  ],
  reading: [
    "Technology va sun'iy intellekt haqida matn",
    "Tabiat va ekologiya mavzusida",
    "Sog'liq va sport haqida passage",
  ],
  listening: [
    "Airport dialoglar haqida",
    "University lecture mavzusida",
    "Kundalik suhbat savollari",
  ],
};

export const AIExamGenerateDialog = ({ open, onOpenChange, onSuccess }: AIExamGenerateDialogProps) => {
  const [skill, setSkill] = useState('grammar');
  const [level, setLevel] = useState('B1');
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ title: string; questionCount: number } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Buyruq kiriting");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-test', {
        body: { prompt, skill, level, questionCount, timeLimit, targetTable: 'exams' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({ title: data.title, questionCount: data.questionCount });
      toast.success(`"${data.title}" exam yaratildi!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Exam yaratishda xatolik");
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setPrompt('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI bilan exam yaratish
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold">Exam yaratildi!</h3>
            <p className="text-muted-foreground">
              <strong>"{result.title}"</strong> — {result.questionCount} ta savol bilan yaratildi
            </p>
            <p className="text-xs text-muted-foreground">Exam yopiq holatda yaratildi. Foydalanuvchilarga tayinlang va ochiq qiling.</p>
            <Button onClick={handleClose} className="mt-4">Yopish</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ko'nikma turi *</Label>
              <div className="grid grid-cols-3 gap-2">
                {skills.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setSkill(s.value); setPrompt(''); }}
                    className={`p-3 rounded-xl border-2 text-center transition-all text-sm ${
                      skill === s.value
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:border-primary/30 text-muted-foreground'
                    }`}
                  >
                    <span className="text-lg block mb-1">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daraja *</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Savollar soni</Label>
                <Input type="number" min={5} max={30} value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vaqt chegarasi (daqiqa)</Label>
              <Input type="number" min={5} max={180} value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Buyruq (prompt) *
              </Label>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Masalan: Transport mavzusida grammar test yaratib ber..." rows={3} />
              <div className="flex gap-2 flex-wrap">
                {(promptExamples[skill] || []).map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Bekor qilish</Button>
              <Button onClick={handleGenerate} disabled={generating || !prompt.trim()}>
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI yaratmoqda...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Yaratish</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
