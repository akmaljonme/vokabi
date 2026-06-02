import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Music } from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { toast } from 'sonner';

interface AudioFile {
  id?: string;
  test_id: string;
  question_id?: string | null;
  file_name: string;
  file_url: string;
  duration?: number | null;
  transcript?: string | null;
  order_index?: number;
}

interface AudioFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioFile: AudioFile | null;
  testId: string;
  onSave: (data: AudioFile) => Promise<void>;
  loading: boolean;
  audioCount?: number;
}

export const AudioFileDialog = ({
  open,
  onOpenChange,
  audioFile,
  testId,
  onSave,
  loading,
  audioCount = 0,
}: AudioFileDialogProps) => {
  const [formData, setFormData] = useState<AudioFile>({
    test_id: testId,
    file_name: '',
    file_url: '',
    duration: null,
    transcript: null,
    order_index: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioFile) {
      setFormData({
        id: audioFile.id,
        test_id: testId,
        file_name: audioFile.file_name,
        file_url: audioFile.file_url,
        duration: audioFile.duration,
        transcript: audioFile.transcript,
        order_index: audioFile.order_index ?? 0,
      });
    } else {
      setFormData({
        test_id: testId,
        file_name: '',
        file_url: '',
        duration: null,
        transcript: null,
        order_index: audioCount,
      });
    }
    setSelectedFile(null);
  }, [audioFile, testId, open, audioCount]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Faqat audio fayllar qabul qilinadi');
        return;
      }
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, file_name: file.name }));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${testId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('audio').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let fileUrl = formData.file_url;

    if (selectedFile) {
      setUploading(true);
      try {
        fileUrl = await uploadFile(selectedFile);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Audio faylni yuklashda xatolik');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSave({
      ...formData,
      file_url: fileUrl,
    });
  };

  const isSubmitDisabled = loading || uploading || !formData.file_name || (!formData.file_url && !selectedFile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{audioFile ? 'Audioni tahrirlash' : 'Yangi audio qo\'shish'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file_name">Fayl nomi *</Label>
            <Input
              id="file_name"
              value={formData.file_name}
              onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
              placeholder="Listening Part 1 - Audio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Audio fayl *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : formData.file_url ? (
                <div className="flex items-center justify-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  <span className="text-sm">Mavjud audio fayl yuklangan</span>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Audio faylni tanlash uchun bosing
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, OGG formatlar qabul qilinadi
                  </p>
                </div>
              )}
            </div>
          </div>

          {formData.file_url && !selectedFile && (
            <div className="space-y-2">
              <Label>Hozirgi audio</Label>
              <audio controls className="w-full">
                <source src={formData.file_url} />
              </audio>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="duration">Davomiyligi (soniyalarda)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={formData.duration || ''}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || null })}
              placeholder="120"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">Part raqami (0 dan boshlanadi)</Label>
            <Input
              id="order_index"
              type="number"
              min={0}
              value={formData.order_index ?? 0}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              placeholder="0 = Part 1, 1 = Part 2..."
            />
            <p className="text-xs text-muted-foreground">
              Har bir part uchun alohida audio qo'shing (0 = Part 1, 1 = Part 2, ...)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcript">Transkript (ixtiyoriy)</Label>
            <Textarea
              id="transcript"
              value={formData.transcript || ''}
              onChange={(e) => setFormData({ ...formData, transcript: e.target.value || null })}
              placeholder="Audio matnining yozma varianti..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? 'Yuklanmoqda...' : audioFile ? 'Saqlash' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
