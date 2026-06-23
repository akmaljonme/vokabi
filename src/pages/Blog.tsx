import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Tag, Search } from "lucide-react";

const POSTS = [
  {
    slug: "ielts-7-ball-olish",
    title: "IELTS 7 ball olish uchun 30 kunlik reja",
    excerpt: "IELTS da 7 ball olish uchun nima kerak? Bu maqolada 30 kunlik tayyorgarlik rejasi, resurslar va AI yordamida mashq qilish usullari haqida gaplashamiz.",
    category: "IELTS",
    readTime: 8,
    date: "2026-06-15",
    emoji: "🎯",
    tags: ["IELTS", "7 ball", "tayyorgarlik"],
  },
  {
    slug: "cefr-darajalari",
    title: "CEFR darajalari: A1 dan C2 gacha to'liq qo'llanma",
    excerpt: "CEFR (Common European Framework of Reference) — ingliz tilini baholashning xalqaro standarti. A1 dan C2 gacha har bir darajada nima bilish kerakligini bilib oling.",
    category: "CEFR",
    readTime: 6,
    date: "2026-06-10",
    emoji: "📊",
    tags: ["CEFR", "daraja", "baholash"],
  },
  {
    slug: "ingliz-tili-orgatish-usullari",
    title: "Ingliz tilini o'rganishning 7 ta samarali usuli",
    excerpt: "Ko'pchilik ingliz tilini o'rganishda bir xil xato qiladi — faqat grammatika o'qiydi. Bu maqolada tez o'rganishning ilmiy asoslangan usullari haqida gaplashamiz.",
    category: "O'rganish",
    readTime: 7,
    date: "2026-06-05",
    emoji: "🧠",
    tags: ["o'rganish", "usullar", "maslahat"],
  },
  {
    slug: "speaking-yaxshilash",
    title: "Speaking ko'nikmangizni 2 haftada yaxshilash",
    excerpt: "Speaking — ko'pchilik uchun eng qiyin ko'nikma. AI bilan mashq qilish, shadowing texnikasi va kundalik amaliyot orqali tez yaxshilash mumkin.",
    category: "Speaking",
    readTime: 5,
    date: "2026-05-28",
    emoji: "🗣️",
    tags: ["speaking", "talaffuz", "mashq"],
  },
  {
    slug: "vocabulary-kengaytirish",
    title: "Haftalik 100 ta yangi so'z yodlash texnikasi",
    excerpt: "So'z boyligini kengaytirish uchun spaced repetition, kontekst orqali o'rganish va o'yin usullari. Ilmiy asoslangan yondashuv bilan tez yodlang.",
    category: "Vocabulary",
    readTime: 6,
    date: "2026-05-20",
    emoji: "📚",
    tags: ["vocabulary", "so'z", "yodlash"],
  },
  {
    slug: "ai-ingliz-tili",
    title: "AI bilan ingliz tili o'rganish — kelajak bu yerda",
    excerpt: "Sun'iy intellekt ingliz tili o'rganishni qanday o'zgartirmoqda? Vokabi AI yordamida Writing, Speaking baholash va shaxsiy o'quv rejasi haqida.",
    category: "AI",
    readTime: 5,
    date: "2026-05-15",
    emoji: "🤖",
    tags: ["AI", "texnologiya", "kelajak"],
  },
];

const CATEGORIES = ["Barchasi", "IELTS", "CEFR", "Speaking", "Vocabulary", "O'rganish", "AI"];

const categoryColors: Record<string, string> = {
  "IELTS": "bg-blue-500/10 text-blue-500",
  "CEFR": "bg-purple-500/10 text-purple-500",
  "Speaking": "bg-green-500/10 text-green-500",
  "Vocabulary": "bg-amber-500/10 text-amber-500",
  "O'rganish": "bg-red-500/10 text-red-500",
  "AI": "bg-cyan-500/10 text-cyan-500",
};

export default function Blog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Barchasi");

  const filtered = POSTS.filter(p => {
    const matchCat = category === "Barchasi" || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-16 max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              📝 Blog
            </span>
            <h1 className="text-4xl sm:text-5xl font-display font-black mb-4 tracking-tight">
              Ingliz tili haqida
              <span className="text-primary"> foydali maqolalar</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              IELTS, CEFR, speaking, vocabulary va AI texnologiyalar haqida ekspertlar maslahati
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 mb-10">
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Maqola qidirish..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  category === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured post */}
        {category === "Barchasi" && !search && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10">
            <Link to={`/blog/${POSTS[0].slug}`}>
              <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-8 hover:border-primary/40 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-5xl">{POSTS[0].emoji}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[POSTS[0].category]}`}>
                    {POSTS[0].category}
                  </span>
                </div>
                <h2 className="text-2xl font-display font-black mb-3 group-hover:text-primary transition-colors">
                  {POSTS[0].title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{POSTS[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{POSTS[0].readTime} daqiqa</span>
                  <span>{POSTS[0].date}</span>
                  <span className="ml-auto flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">
                    O'qish <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(category === "Barchasi" && !search ? filtered.slice(1) : filtered).map((post, i) => (
            <motion.div key={post.slug}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}>
              <Link to={`/blog/${post.slug}`}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{post.emoji}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[post.category]}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime} daqiqa</span>
                    <span>{post.date}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-3">🔍</p>
            <p>Hech narsa topilmadi</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-primary/5 border border-primary/20 p-10 text-center">
          <h3 className="text-2xl font-black mb-3">Bilimingizni sinab ko'ring! 🚀</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Maqolalarni o'qib bo'lgach, Vokabi da IELTS va CEFR testlarini topshiring
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5">
            Bepul boshlash <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
