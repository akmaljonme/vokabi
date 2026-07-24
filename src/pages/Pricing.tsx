import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { PaymentDialog } from "@/components/payment/PaymentDialog";

export type PlanKey = "1_month" | "6_months" | "1_year";

export const PLANS: Array<{
  key: PlanKey;
  name: string;
  price: number;
  priceLabel: string;
  perMonth: string;
  badge?: string;
  highlight?: boolean;
  savings?: string;
}> = [
  { key: "1_month",  name: "1 oy",   price: 25000,  priceLabel: "25 000 so'm",  perMonth: "25 000 so'm/oy" },
  { key: "6_months", name: "6 oy",   price: 75000,  priceLabel: "75 000 so'm",  perMonth: "12 500 so'm/oy", badge: "Eng mashhur", highlight: true, savings: "50% tejash" },
  { key: "1_year",   name: "1 yil",  price: 130000, priceLabel: "130 000 so'm", perMonth: "10 833 so'm/oy", savings: "57% tejash" },
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
  const navigate = useNavigate();
  const [dialogPlan, setDialogPlan] = useState<typeof PLANS[number] | null>(null);

  const handleBuy = (plan: typeof PLANS[number]) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setDialogPlan(plan);
  };

  // Success/cancel URL dan xabar ko'rsatish (eski Stripe havolalaridan qolgan foydalanuvchilar uchun)
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "true";
  const isCanceled = params.get("canceled") === "true";

  return (
    <AppLayout>
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

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-center"
          >
            <div className="text-2xl mb-2">🎉</div>
            <div className="font-semibold text-green-700 dark:text-green-400">To'lov muvaffaqiyatli!</div>
            <div className="text-sm text-muted-foreground mt-1">Pro obunangiz faollashtirildi. Rahmat!</div>
          </motion.div>
        )}

        {isCanceled && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
            <div className="text-sm text-muted-foreground">To'lov bekor qilindi. Istalgan vaqt qayta urinib ko'ring.</div>
          </div>
        )}

        {isPro && !isSuccess && (
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
                  <span className="text-4xl font-display font-bold">{plan.priceLabel}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{plan.perMonth}</div>
                {plan.savings && (
                  <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
                    <Zap className="w-3 h-3" /> {plan.savings}
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-8">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan)}
                disabled={isPro}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
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

        <div className="text-center mt-12 text-sm text-muted-foreground max-w-xl mx-auto space-y-1">
          <p>Humo/UzCard orqali to'lov — chek yuklaysiz, admin 1-2 soat ichida tasdiqlaydi.</p>
          <p>Obunani istalgan vaqt bekor qilish mumkin.</p>
        </div>
      </main>
      <Footer />

      {dialogPlan && (
        <PaymentDialog
          plan={{ key: dialogPlan.key, name: dialogPlan.name, price: dialogPlan.price }}
          open={!!dialogPlan}
          onClose={() => setDialogPlan(null)}
        />
      )}
    </AppLayout>
  );
};

export default Pricing;
