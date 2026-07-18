import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Users, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sb } from "@/integrations/supabase/client";
import { toast } from "sonner";
const supabase: any = _sb;

const REFERRALS_PER_REWARD = 10;

export const ReferralWidget = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [rewardsGranted, setRewardsGranted] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("referral_code, referral_rewards_granted").eq("user_id", user.id).maybeSingle(),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
      ]);
      setReferralCode(profile?.referral_code || "");
      setRewardsGranted(profile?.referral_rewards_granted || 0);
      setReferralCount(count || 0);
      setLoading(false);
    };
    load();
  }, [user]);

  const referralUrl = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : "";
  const towardNext = referralCount % REFERRALS_PER_REWARD;
  const remaining = REFERRALS_PER_REWARD - towardNext;
  const progressPct = Math.round((towardNext / REFERRALS_PER_REWARD) * 100);

  const copyLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Havola nusxa olindi! 🎉");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTelegram = () => {
    const text = `🎓 Vokabi bilan ingliz tilini o'rganing!\n\nAI testlar, IELTS tayyorgarlik, 21+ o'yin — barchasi bepul!\n\n🔗 ${referralUrl}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!user || loading) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-black text-base">Do'stlarni taklif qiling! 🎁</h3>
          <p className="text-xs text-muted-foreground">Har 10 ta do'st — 1 oylik Pro reja bepul</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl bg-background/60 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xl font-black">{referralCount}</span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">Taklif qilingan</p>
        </div>
        <div className="rounded-2xl bg-background/60 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
            <Crown className="w-4 h-4" />
            <span className="text-xl font-black">{rewardsGranted}</span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">Yutilgan Pro oylar</p>
        </div>
      </div>

      {/* Progress toward next reward */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Keyingi Pro oygacha</span>
          <span className="text-xs font-bold text-primary">{towardNext} / {REFERRALS_PER_REWARD}</span>
        </div>
        <div className="h-2 rounded-full bg-background/60 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Yana {remaining} ta do'stingiz ro'yxatdan o'tsa — 1 oylik Pro reja avtomatik beriladi!
        </p>
      </div>

      {/* Referral link */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-background/60 border border-border mb-4">
        <input readOnly value={referralUrl}
          className="flex-1 text-xs bg-transparent text-muted-foreground truncate outline-none font-mono" />
        <button onClick={copyLink}
          className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all">
          {copied ? <><Check className="w-3 h-3" /> Nusxa!</> : <><Copy className="w-3 h-3" /> Nusxa</>}
        </button>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={shareOnTelegram}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#2AABEE,#229ED9)" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.554c-.149.668-.537.83-1.088.517l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.085 14.6l-2.953-.924c-.642-.2-.655-.642.136-.951l11.527-4.445c.537-.194 1.006.131.767.968z"/>
          </svg>
          Telegram
        </button>
        <button onClick={() => {
          const text = `🎓 Vokabi bilan ingliz tilini o'rgan! ${referralUrl}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
        }}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:opacity-90 transition-all">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </button>
      </div>
    </motion.div>
  );
};
