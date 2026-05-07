import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { PaymentDialog } from "@/components/payment/PaymentDialog";
import { useUserRole } from "@/hooks/useUserRole";

export type PlanKey = "1_month" | "3_months" | "1_year";

export const PLANS: Array<{
  key: PlanKey;
  name: string;
  price: number;
  perMonth: number;
  badge?: string;
  highlight?: boolean;
  savings?: string;
}> = [
  { key: "1_month", name: "1 oy", price: 10000, perMonth: 10000 },
  { key: "3_months", name: "3 oy", price: 25000, perMonth: 8333, badge: "Eng mashhur", highlight: true, savings: "17% tejash" },
  { key: "1_year", name: "1 yil", price: 99990, perMonth: 8332, savings: "17% tejash" },
];

const FEATURES = [
  "Cheksiz Speaking & Writing baholash",
  "AI Tutor — cheksiz savollar",
  "Barcha CEFR darslari (A1–C1)",
  "Cheksiz mock testlar",
  "Sertifikat yuklab olish",
  "Haftalik AI Study Plan",
  "Video darslar to'liq kirish",
  "Reklamasiz tajriba",
];

const Pricing = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanKey | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={(v) => navigate(v === "levels" ? "/" : "/")} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Crown className="w-3.5 h-3.5" /> Vokabi Pro
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
            Cheksiz o'rganish, bir tarif
          </h1>
          <p className="text-muted-foreground text-lg">
            AI bilan Speaking, Writing, cheksiz testlar va sertifikatlar — eng past narxda.
          </p>
        </motion.div>

        {isPro && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-2xl bg-primary/10 border border-primary/30 text-center">
            <Crown className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-semibold">Sizda Pro obuna faol ✨</div>
            <div className="text-sm text-muted-foreground">Rahmat! Barcha imkoniyatlardan foydalaning.</div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.key}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl p-8 border transition-all ${
                plan.highlight
                  ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-2xl shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">
                    {plan.price.toLocaleString("uz-UZ")}
                  </span>
                  <span className="text-muted-foreground">so'm</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ≈ {plan.perMonth.toLocaleString("uz-UZ")} so'm/oy
                </div>
                {plan.savings && (
                  <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
                    <Zap className="w-3 h-3" /> {plan.savings}
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-8">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                    return;
                  }
                  setSelected(plan.key);
                }}
                disabled={isPro}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-foreground text-background hover:opacity-90"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isPro ? "Faol obuna" : "Sotib olish"}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground max-w-xl mx-auto">
          To'lov karta orqali amalga oshiriladi. Chekni yuklaganingizdan so'ng admin 1-2 soat ichida tasdiqlaydi va Pro avtomat yoqiladi.
        </div>
      </main>

      <Footer />

      {selected && (
        <PaymentDialog
          plan={PLANS.find((p) => p.key === selected)!}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default Pricing;