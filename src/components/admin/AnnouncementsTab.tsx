import { useState } from "react";
import { Rocket, Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { toast } from "sonner";
import { logAdminAction } from "@/lib/adminAudit";

export const AnnouncementsTab = () => {
  const [title, setTitle] = useState("🎉 Yangi yangilanish!");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSentCount, setLastSentCount] = useState<number | null>(null);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Sarlavha va matnni to'ldiring");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.rpc("broadcast_notification", {
        p_title: title.trim(),
        p_body: body.trim(),
        p_type: "announcement",
      });
      if (error) throw error;
      setLastSentCount(data);
      await logAdminAction("broadcast_sent", null, { title: title.trim(), recipients: data });
      toast.success(`✅ ${data} ta foydalanuvchiga yuborildi!`);
      setBody("");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Yuborishda xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Rocket className="w-6 h-6 text-primary" /> Yangilanish e'loni
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Har bir yangi versiya/funksiya chiqarilgandan so'ng, shu yerdan{" "}
          <strong>barcha foydalanuvchilarga</strong> bir marta bosish bilan bildirishnoma yuboring.
          Ular buni Bildirishnomalar bo'limida ko'radi.
        </p>
      </div>

      <Card className="border-border/50 max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Yangi e'lon</CardTitle>
          <CardDescription>Qisqa va aniq yozing — bu push-bildirishnoma emas, in-app xabar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Sarlavha</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Matn</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Masalan: Endi profilingiz Instagram uslubida! Post, Reel va So'rovnoma joylang..."
              rows={4}
              maxLength={300}
            />
            <p className="text-[10px] text-muted-foreground text-right">{body.length} / 300</p>
          </div>
          <Button onClick={send} disabled={sending} className="w-full">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Barcha foydalanuvchilarga yuborish
          </Button>
          {lastSentCount !== null && (
            <p className="text-xs text-emerald-500 text-center">
              ✅ Oxirgi yuborish: {lastSentCount} ta foydalanuvchiga yetkazildi
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
