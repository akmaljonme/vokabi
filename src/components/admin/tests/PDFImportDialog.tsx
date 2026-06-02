import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { toast } from 'sonner';
import { Upload, FileText, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface PDFImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
const skills = ['reading', 'listening', 'grammar', 'vocabulary', 'speaking', 'writing'];

export const PDFImportDialog = ({ open, onOpenChange, onSuccess }: PDFImportDialogProps) => {
  const [step, setStep] = useState<'upload' | 'config' | 'processing' | 'done'>('upload');
  const [pdfText, setPdfText] = useState('');
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    level: 'B1',
    skill: 'reading',
    time_limit: 1800,
  });
  const [result, setResult] = useState<{ questions_count: number; passages_count: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Faqat PDF fayl yuklang');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fayl hajmi 10MB dan oshmasligi kerak');
      return;
    }

    setFileName(file.name);
    setExtracting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load pdf.js dynamically
      const pdfjsScript = document.createElement('script');
      pdfjsScript.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
      
      // Use global pdfjsLib
      const pdfjsLib = await new Promise<any>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.js';
        script.onload = () => resolve((window as any).pdfjsLib);
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js';

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}`;
      }

      if (fullText.trim().length < 50) {
        toast.error('PDF dan matn ajratib bo\'lmadi. Skanerlangan PDF bo\'lishi mumkin.');
        setExtracting(false);
        return;
      }

      setPdfText(fullText);
      setConfig(prev => ({ ...prev, title: file.name.replace('.pdf', '') }));
      setStep('config');
    } catch (err) {
      console.error('PDF parsing error:', err);
      toast.error('PDF ni o\'qishda xatolik yuz berdi');
    } finally {
      setExtracting(false);
    }
  };

  const handlePasteText = () => {
    if (pdfText.trim().length < 50) {
      toast.error('Kamida 50 ta belgi kiriting');
      return;
    }
    setStep('config');
  };

  const handleProcess = async () => {
    if (!config.title.trim()) {
      toast.error('Test nomini kiriting');
      return;
    }

    setStep('processing');

    try {
      const { data, error } = await supabase.functions.invoke('parse-pdf-test', {
        body: {
          pdf_text: pdfText,
          test_config: {
            title: config.title,
            description: config.description,
            level: config.level,
            skill: config.skill,
            time_limit: config.time_limit,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({
        questions_count: data.questions_count || 0,
        passages_count: data.passages_count || 0,
      });
      setStep('done');
    } catch (err: any) {
      console.error('Process error:', err);
      toast.error(err.message || 'AI ishlov berishda xatolik');
      setStep('config');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setPdfText('');
    setFileName('');
    setResult(null);
    setConfig({ title: '', description: '', level: 'B1', skill: 'reading', time_limit: 1800 });
    onOpenChange(false);
    if (result) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            PDF dan test import qilish
          </DialogTitle>
          <DialogDescription>
            PDF faylni yuklang — AI avtomatik savollarni ajratib, test yaratadi
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                disabled={extracting}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {extracting ? (
                  <>
                    <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                    <p className="font-medium">PDF o'qilmoqda...</p>
                    <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">PDF faylni yuklang</p>
                    <p className="text-xs text-muted-foreground mt-1">Maksimal 10MB</p>
                  </>
                )}
              </label>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">yoki matn qo'ying</span>
              </div>
            </div>

            <Textarea
              value={pdfText}
              onChange={e => setPdfText(e.target.value)}
              placeholder="Test matnini shu yerga joylashtiring..."
              rows={6}
              className="text-sm"
            />

            <Button onClick={handlePasteText} disabled={pdfText.trim().length < 50} className="w-full">
              <FileText className="w-4 h-4 mr-2" /> Matn bilan davom etish
            </Button>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 'config' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                <FileText className="w-4 h-4 inline mr-1" />
                {fileName || 'Matn'} — {pdfText.length.toLocaleString()} belgi ajratildi
              </p>
            </div>

            <div className="space-y-2">
              <Label>Test nomi *</Label>
              <Input
                value={config.title}
                onChange={e => setConfig(p => ({ ...p, title: e.target.value }))}
                placeholder="Reading Comprehension Test 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Input
                value={config.description}
                onChange={e => setConfig(p => ({ ...p, description: e.target.value }))}
                placeholder="Test haqida qisqacha..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daraja</Label>
                <Select value={config.level} onValueChange={v => setConfig(p => ({ ...p, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ko'nikma</Label>
                <Select value={config.skill} onValueChange={v => setConfig(p => ({ ...p, skill: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {skills.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vaqt chegarasi (daqiqa)</Label>
              <Input
                type="number"
                min={5}
                max={180}
                value={config.time_limit / 60}
                onChange={e => setConfig(p => ({ ...p, time_limit: (parseInt(e.target.value) || 30) * 60 }))}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>Orqaga</Button>
              <Button onClick={handleProcess} disabled={!config.title.trim()}>
                <Sparkles className="w-4 h-4 mr-2" /> AI bilan yaratish
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="font-display font-bold text-lg mb-2">AI ishlov bermoqda...</h3>
            <p className="text-sm text-muted-foreground">Savollar ajratilmoqda va test yaratilmoqda</p>
            <p className="text-xs text-muted-foreground mt-2">Bu 15-30 soniya davom etishi mumkin</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && result && (
          <div className="py-8 text-center">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-display font-bold text-xl mb-2">Test yaratildi! 🎉</h3>
            <div className="flex justify-center gap-6 my-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{result.questions_count}</p>
                <p className="text-xs text-muted-foreground">savol</p>
              </div>
              {result.passages_count > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{result.passages_count}</p>
                  <p className="text-xs text-muted-foreground">matn</p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Test "Nofaol" holatda yaratildi. Savollarni tekshirib, faollashtiring.
            </p>
            <Button onClick={handleClose}>Tayyor</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
