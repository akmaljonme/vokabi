import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [levelInfo, setLevelInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim() || !fullName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('feedbacks' as any).insert({
        user_id: user.id,
        full_name: fullName.trim(),
        rating,
        message: message.trim(),
        level_info: levelInfo.trim() || null,
      } as any);

      if (error) throw error;
      toast.success("Fikringiz yuborildi! Admin tasdiqlangandan so'ng saytda ko'rinadi.");
      setMessage('');
      setFullName('');
      setLevelInfo('');
      setRating(5);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Fikringizni bildiring</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ismingiz *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ismingiz Familiyangiz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Darajangiz (ixtiyoriy)</Label>
            <Input
              value={levelInfo}
              onChange={(e) => setLevelInfo(e.target.value)}
              placeholder="Masalan: B1 → B2, IELTS 7.0"
            />
          </div>

          <div className="space-y-2">
            <Label>Baho</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fikringiz *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Platformamiz haqida fikringizni yozing..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading || !message.trim() || !fullName.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yuborish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
