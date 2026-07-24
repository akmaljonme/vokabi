import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Upload, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import type { PlanKey } from "@/pages/Pricing";

export const CARD_NUMBER = "9860 3566 2914 3336";
export const CARD_HOLDER = "KARIMBOYEV NORMETOV";

interface Props {
  plan: { key: PlanKey; name: string; price: number };
  open: boolean;
  onClose: () => void;
}

export const PaymentDialog = ({ plan, open, onClose }: Props) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const copyCard = async () => {
    await navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    toast.success("Karta raqami nusxalandi");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!file) {
      toast.error("Iltimos, chek skrinshotini yuklang");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fayl 5MB dan kichik bo'lishi kerak");
      return;
    }

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-receipts")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { error: insErr } = await (supabase.from("payment_requests") as any).insert({
        user_id: user.id,
        plan: plan.key,
        amount: plan.price,
        receipt_url: path,
        user_note: note || null,
      });
      if (insErr) throw insErr;

      setSubmitted(true);
      toast.success("So'rov yuborildi! Admin tez orada tasdiqlaydi.");
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="mb-2">So'rov qabul qilindi!</DialogTitle>
            <DialogDescription>
              Admin chekni 1-2 soat ichida tekshiradi va Pro obunangiz avtomat yoqiladi. Tasdiqlangach sizga bildirishnoma keladi.
            </DialogDescription>
            <Button onClick={onClose} className="mt-6 w-full">Yopish</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {plan.name} obunasi
              </DialogTitle>
              <DialogDescription>
                Quyidagi karta raqamiga {plan.price.toLocaleString("uz-UZ")} so'm o'tkazing va chek skrinshotini yuklang.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                <div className="text-xs opacity-80 mb-1">Humo karta</div>
                <div className="text-xl font-mono tracking-wider mb-3">{CARD_NUMBER}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] opacity-70 uppercase">Karta egasi</div>
                    <div className="text-sm font-semibold">{CARD_HOLDER}</div>
                  </div>
                  <button
                    onClick={copyCard}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Nusxalandi" : "Nusxa olish"}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                <span className="text-sm text-muted-foreground">To'lov summasi</span>
                <span className="text-lg font-bold">{plan.price.toLocaleString("uz-UZ")} so'm</span>
              </div>

              {/* Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Chek skrinshotini yuklang *</label>
                <label
                  htmlFor="receipt-file"
                  className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    {file ? file.name : "PNG, JPG (max 5MB)"}
                  </div>
                </label>
                <input
                  id="receipt-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-2">Izoh (ixtiyoriy)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="Telefon raqam, savol va h.k."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <Button onClick={handleSubmit} disabled={submitting || !file} className="w-full">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yuborilmoqda...</>
                ) : (
                  "So'rovni yuborish"
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Admin chekni 1-2 soat ichida tekshiradi va Pro avtomat yoqiladi.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};