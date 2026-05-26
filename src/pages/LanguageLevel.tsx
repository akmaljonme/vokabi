import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { LANGUAGES } from "@/data/languages";
import { ArrowLeft, BookOpen, Gamepad2, PenTool, Volume2, Brain } from "lucide-react";

export default function LanguageLevel() {
  const { langId, level } = useParams();
  const navigate = useNavigate();
  const lang = LANGUAGES.find(l => l.id === langId);

  if (!lang) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Til topilmadi</p>
          <button onClick={() => navigate("/languages")} className="btn-primary px-5 py-2.5">
            Tillarga qaytish
          </button>
        </div>
      </AppLayout>
    );
  }

  const lvl = level?.toUpperCase() || "A1";

  const activities = [
    { icon: BookOpen,  label: "Vocabulary",   desc: "Yangi so'zlar o'rganing",      action: () => navigate("/wordbank"),  color: "bg-blue-500/10 text-blue-500" },
    { icon: Gamepad2,  label: "O'yinlar",      desc: "So'zlarni o'yin bilan mustahkamlang", action: () => navigate("/games"), color: "bg-green-500/10 text-green-500" },
    { icon: PenTool,   label: "Writing",       desc: "Essay yozing va AI baholaydi", action: () => navigate("/essay"),     color: "bg-purple-500/10 text-purple-500" },
    { icon: Volume2,   label: "Listening",     desc: "Video darslar tinglang",       action: () => navigate("/videos"),    color: "bg-orange-500/10 text-orange-500" },
    { icon: Brain,     label: "Practice Test", desc: "Darajangizni sinab ko'ring",   action: () => navigate("/exams"),    color: "bg-red-500/10 text-red-500" },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back */}
        <button onClick={() => navigate("/languages")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Barcha tillar
        </button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-3xl p-8 mb-8 bg-gradient-to-br ${lang.color} overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
          <div className="relative flex items-center gap-5">
            <span className="text-6xl">{lang.flag}</span>
            <div className="text-white">
              <p className="text-white/70 text-sm mb-1">{lang.name}</p>
              <h1 className="text-4xl font-display font-bold">{lvl} Daraja</h1>
              <p className="text-white/70 mt-1">
                {lvl === "A1" ? "Boshlang'ich" : lvl === "A2" ? "Elementar" : lvl === "B1" ? "O'rta" : lvl === "B2" ? "Yuqori o'rta" : lvl === "C1" ? "Ilg'or" : "Ustoz"} daraja
              </p>
            </div>
          </div>
        </motion.div>

        {/* Activities */}
        <h2 className="font-bold text-lg mb-4">Mashq turlari</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((a, i) => (
            <motion.button key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              onClick={a.action}
              className="card-elevated rounded-2xl p-5 text-left border border-border/40 hover:border-primary/30 transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-1">{a.label}</h3>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
