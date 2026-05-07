import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X, Eye, Clock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Status = "pending" | "approved" | "rejected";

interface PaymentRequest {
  id: string;
  user_id: string;
  plan: "1_month" | "3_months" | "1_year";
  amount: number;
  receipt_url: string;
  status: Status;
  user_note: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: { full_name: string | null; username: string | null };
}

const PLAN_DAYS: Record<string, number> = {
  "1_month": 30,
  "3_months": 90,
  "1_year": 365,
};

const PLAN_LABEL: Record<string, string> = {
  "1_month": "1 oy",
  "3_months": "3 oy",
  "1_year": "1 yil",
};

export const PaymentsTab = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status>("pending");
  const [viewing, setViewing] = useState<PaymentRequest | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("payment_requests") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    // Fetch profiles
    const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
    const { data: profiles } = await (supabase.from("profiles") as any)
      .select("user_id, full_name, username")
      .in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setRequests((data || []).map((r: any) => ({ ...r, profile: profileMap.get(r.user_id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openReceipt = async (req: PaymentRequest) => {
    setViewing(req);
    const { data } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(req.receipt_url, 600);
    setSignedUrl(data?.signedUrl || null);
  };

  const approve = async (req: PaymentRequest) => {
    setProcessing(req.id);
    try {
      const days = PLAN_DAYS[req.plan];
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      // Upsert subscription
      const { data: existing } = await (supabase.from("subscriptions") as any)
        .select("id, expires_at")
        .eq("user_id", req.user_id)
        .maybeSingle();

      // If user already has Pro that's not expired, extend from current expiry
      let finalExpiry = expiresAt;
      if (existing?.expires_at && new Date(existing.expires_at) > new Date()) {
        finalExpiry = new Date(new Date(existing.expires_at).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      if (existing) {
        const { error } = await (supabase.from("subscriptions") as any)
          .update({ plan: "pro", expires_at: finalExpiry, started_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("subscriptions") as any).insert({
          user_id: req.user_id,
          plan: "pro",
          expires_at: finalExpiry,
        });
        if (error) throw error;
      }

      const { error: updErr } = await (supabase.from("payment_requests") as any)
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", req.id);
      if (updErr) throw updErr;

      toast.success(`Pro ${PLAN_LABEL[req.plan]} muddatga yoqildi`);
      setViewing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (req: PaymentRequest) => {
    setProcessing(req.id);
    const { error } = await (supabase.from("payment_requests") as any)
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", req.id);
    setProcessing(null);
    if (error) return toast.error(error.message);
    toast.success("So'rov rad etildi");
    setViewing(null);
    load();
  };

  const filtered = requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> To'lov so'rovlari
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Foydalanuvchi cheklarini tekshiring va Pro yoqing
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["pending", "approved", "rejected"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {s === "pending" && `Kutilmoqda (${pendingCount})`}
            {s === "approved" && "Tasdiqlangan"}
            {s === "rejected" && "Rad etilgan"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Hozircha {filter === "pending" ? "yangi" : filter === "approved" ? "tasdiqlangan" : "rad etilgan"} so'rov yo'q
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((req) => (
            <div key={req.id} className="p-4 rounded-2xl border border-border bg-card flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    {req.profile?.username ? `@${req.profile.username}` : req.profile?.full_name || "User"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {PLAN_LABEL[req.plan]}
                  </span>
                  <span className="font-bold">{req.amount.toLocaleString("uz-UZ")} so'm</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(req.created_at).toLocaleString("uz-UZ")}
                </div>
                {req.user_note && (
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    "{req.user_note}"
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => openReceipt(req)}>
                <Eye className="w-4 h-4 mr-1" /> Ko'rish
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>To'lov tekshiruvi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-muted">
                    <div className="text-xs text-muted-foreground">Foydalanuvchi</div>
                    <div className="font-semibold">
                      {viewing.profile?.username ? `@${viewing.profile.username}` : viewing.profile?.full_name}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <div className="text-xs text-muted-foreground">Tarif</div>
                    <div className="font-semibold">{PLAN_LABEL[viewing.plan]}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <div className="text-xs text-muted-foreground">Summa</div>
                    <div className="font-semibold">{viewing.amount.toLocaleString("uz-UZ")} so'm</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <div className="text-xs text-muted-foreground">Sana</div>
                    <div className="font-semibold text-xs">{new Date(viewing.created_at).toLocaleString("uz-UZ")}</div>
                  </div>
                </div>

                {viewing.user_note && (
                  <div className="p-3 rounded-xl bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">Foydalanuvchi izohi</div>
                    <div className="text-sm">{viewing.user_note}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium mb-2">Chek skrinshoti</div>
                  {signedUrl ? (
                    <a href={signedUrl} target="_blank" rel="noreferrer">
                      <img src={signedUrl} alt="Receipt" className="w-full rounded-xl border border-border" />
                    </a>
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                </div>

                {viewing.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approve(viewing)}
                      disabled={processing === viewing.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing === viewing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Check className="w-4 h-4 mr-1" /> Tasdiqlash & Pro yoqish</>
                      )}
                    </Button>
                    <Button
                      onClick={() => reject(viewing)}
                      disabled={processing === viewing.id}
                      variant="destructive"
                    >
                      <X className="w-4 h-4 mr-1" /> Rad etish
                    </Button>
                  </div>
                )}

                {viewing.status !== "pending" && (
                  <div className={`p-3 rounded-xl text-center text-sm font-medium ${
                    viewing.status === "approved" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                  }`}>
                    {viewing.status === "approved" ? "✓ Tasdiqlangan" : "✗ Rad etilgan"}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};