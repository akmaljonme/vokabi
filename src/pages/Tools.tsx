import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import {
  BookOpen, Home, PenTool, Brain, Flame,
  ArrowRight, Sparkles, Clock, Users, Star
} from "lucide-react";

const tools = [
  {
    id: "wordbank",
    title: "So'z Banki",
    desc: "Shaxsiy lug'at yarating. SM-2 spaced repetition algoritmi bilan so'zlarni ilmiy asosda eslab qoling.",
    icon: "📚",
    color: "hsl(217 91% 60%)",
    bg: "hsl(217 91% 60% / 0.08)",
    border: "hsl(217 91% 60% / 0.2)",
    badge: "Spaced Repetition",
    stats: ["3D flip kartalar", "Ovozli talaffuz", "Daraja filtri"],
  },
  {
    id: "study-room",
    title: "Study Room",
    desc: "Real-time boshqalar bilan birga o'qing. Pomodoro timer, live chat va motivatsion muhit.",
    icon: "🏫",
    color: "hsl(142 76% 36%)",
    bg: "hsl(142 76% 36% / 0.08)",
    border: "hsl(142 76% 36% / 0.2)",
    badge: "Live",
    stats: ["Pomodoro timer", "Real-time chat", "4 ta xona"],
  },
  {
    id: "essay",
    title: "AI Essay Checker",
    desc: "Yozgan essayingizni AI bilan tekshiring. IELTS band score va batafsil tahlil oling.",
    icon: "✍️",
    color: "hsl(270 60% 55%)",
    bg: "hsl(270 60% 55% / 0.08)",
    border: "hsl(270 60% 55% / 0.2)",
    badge: "AI Powered",
    stats: ["Band score 0-9", "4 mezon tahlil", "To'g'irlangan versiya"],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function Tools() {
  const navigate = useNavigate();

  return (
    <AppLayout>
            <div className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="premium-badge mb-5 inline-flex">
            <Sparkles className="w-3.5 h-3.5" /> PREMIUM TOOLS
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight text-balance">
            O'rganishni{" "}
            <span className="text-gradient">tezlashtiring</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto text-balance">
            AI va ilmiy metodlar asosida qurilgan professional o'quv vositalari
          </p>
        </motion.div>

        {/* Tool cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
        >
          {tools.map((tool) => (
            <motion.div
              key={tool.id}
              variants={item}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/${tool.id}`)}
              className="group cursor-pointer rounded-2xl p-6 flex flex-col gap-4 border transition-all duration-300"
              style={{
                background: tool.bg,
                borderColor: tool.border,
              }}
            >
              {/* Top */}
              <div className="flex items-start justify-between">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: tool.bg, border: `1px solid ${tool.border}` }}
                >
                  {tool.icon}
                </div>
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: tool.bg, color: tool.color, border: `1px solid ${tool.border}` }}
                >
                  {tool.badge}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-lg font-display font-bold mb-2">{tool.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>

              {/* Stats */}
              <div className="space-y-1.5">
                {tool.stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1 h-1 rounded-full" style={{ background: tool.color }} />
                    {s}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div
                className="flex items-center gap-2 text-sm font-semibold mt-1 group-hover:gap-3 transition-all"
                style={{ color: tool.color }}
              >
                Ochish <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-elevated rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-primary/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Barchasi bepul</h3>
              <p className="text-sm text-muted-foreground">Barcha vositalardan cheksiz foydalaning</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard")}
            className="btn-primary px-6 py-2.5 text-sm whitespace-nowrap"
          >
            Dashboard ga qaytish
          </motion.button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
