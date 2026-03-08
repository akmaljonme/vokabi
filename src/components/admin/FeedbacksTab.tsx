import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  user_id: string;
  full_name: string;
  rating: number;
  message: string;
  level_info: string | null;
  is_approved: boolean;
  created_at: string;
}

export const FeedbacksTab = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedbacks' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setFeedbacks(data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    setActionLoading(id);
    const { error } = await supabase
      .from('feedbacks' as any)
      .update({ is_approved: approve } as any)
      .eq('id', id);

    if (error) {
      toast.error('Xatolik yuz berdi');
    } else {
      toast.success(approve ? 'Tasdiqlandi' : 'Rad etildi');
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_approved: approve } : f));
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase
      .from('feedbacks' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Xatolik yuz berdi');
    } else {
      toast.success("O'chirildi");
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pending = feedbacks.filter(f => !f.is_approved);
  const approved = feedbacks.filter(f => f.is_approved);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Feedbacklar</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Foydalanuvchilar fikrlarini tasdiqlang yoki rad eting
        </p>
      </div>

      {/* Pending */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Kutilmoqda
          {pending.length > 0 && (
            <Badge variant="destructive" className="text-xs">{pending.length}</Badge>
          )}
        </h3>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">Kutilayotgan feedbacklar yo'q</p>
        ) : (
          <div className="grid gap-4">
            {pending.map(fb => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                loading={actionLoading === fb.id}
                onApprove={() => handleApprove(fb.id, true)}
                onReject={() => handleApprove(fb.id, false)}
                onDelete={() => handleDelete(fb.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Tasdiqlangan
          <Badge variant="secondary" className="text-xs">{approved.length}</Badge>
        </h3>
        {approved.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">Tasdiqlangan feedbacklar yo'q</p>
        ) : (
          <div className="grid gap-4">
            {approved.map(fb => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                loading={actionLoading === fb.id}
                onApprove={() => handleApprove(fb.id, false)}
                onDelete={() => handleDelete(fb.id)}
                isApproved
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FeedbackCard = ({
  feedback: fb,
  loading,
  onApprove,
  onReject,
  onDelete,
  isApproved = false,
}: {
  feedback: Feedback;
  loading: boolean;
  onApprove: () => void;
  onReject?: () => void;
  onDelete: () => void;
  isApproved?: boolean;
}) => {
  const initials = fb.full_name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs text-primary">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-sm">{fb.full_name}</div>
            <div className="text-xs text-muted-foreground">
              {fb.level_info && <span>{fb.level_info} • </span>}
              {new Date(fb.created_at).toLocaleDateString('uz-UZ')}
            </div>
          </div>
        </div>
        <div className="flex gap-0.5 mb-2">
          {[...Array(fb.rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{fb.message}</p>
      </div>

      <div className="flex sm:flex-col gap-2 shrink-0">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <>
            {isApproved ? (
              <Button size="sm" variant="outline" onClick={onApprove}>
                <X className="w-4 h-4 mr-1" />Rad etish
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={onApprove}>
                  <Check className="w-4 h-4 mr-1" />Tasdiqlash
                </Button>
                {onReject && (
                  <Button size="sm" variant="outline" onClick={onReject}>
                    <X className="w-4 h-4 mr-1" />Rad
                  </Button>
                )}
              </>
            )}
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
