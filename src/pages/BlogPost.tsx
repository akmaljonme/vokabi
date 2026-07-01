import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Tag, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const POSTS: Record<string, any> = {
  "ielts-7-ball-olish": {
    title: "IELTS 7 ball olish uchun 30 kunlik reja",
    emoji: "🎯",
    category: "IELTS",
    readTime: 8,
    date: "2026-06-15",
    content: `
## IELTS 7 ball — mumkinmi?

Ha, mumkin! IELTS da 7 ball olish uchun siz B2-C1 darajasida ingliz tilini bilishingiz kerak. Bu qiyin, lekin 30 kun davomida to'g'ri mashq qilsangiz — erishish mumkin.

## 1-hafta: Asoslarni mustahkamlash

**Reading:** Har kuni 1 ta IELTS reading passage o'qing. Vaqtingizni hisoblang — 60 daqiqada 3 ta passage.

**Listening:** BBC, CNN dan 30 daqiqa tinglang. Yozib boring — diktant usuli eng yaxshi natija beradi.

**Writing:** Task 1 va Task 2 ni har kuni yozing. AI yordamida tekshiring.

**Speaking:** Kuniga 15 daqiqa o'zingizni yozib oling va tinglang.

## 2-hafta: Ko'nikmalarni oshirish

Reading da **skimming** va **scanning** texnikalarini o'rganing. Savollarga avval qarang, keyin matnni o'qing.

Listening da **prediction** usulini ishlating — audio boshlanishidan oldin savollarni o'qib, javobni taxmin qiling.

Writing da **coherence** va **cohesion** — jumlalar orasidagi bog'liqlik — eng muhim mezon.

## 3-hafta: Mock testlar

Har kuni to'liq mock test topshiring. Natijalarni tahlil qiling:
- Qaysi savol turida xato ko'p?
- Vaqtingiz yetarliymi?
- Writing da grammatik xatolar qanday?

## 4-hafta: Zaif tomonlarni bartaraf etish

Oxirgi haftada faqat zaif tomonlarga e'tibor bering. Kuchli tomonlaringizni mustahkamlang.

## Vokabi bilan mashq qiling

Vokabi platformasida AI yordamida Writing va Speaking ni baholating. IELTS standartida 4 mezon bo'yicha batafsil tahlil olasiz.

**Omad!** 🍀
    `,
    related: ["cefr-darajalari", "speaking-yaxshilash", "vocabulary-kengaytirish"],
  },
  "cefr-darajalari": {
    title: "CEFR darajalari: A1 dan C2 gacha to'liq qo'llanma",
    emoji: "📊",
    category: "CEFR",
    readTime: 6,
    date: "2026-06-10",
    content: `
## CEFR nima?

CEFR — Common European Framework of Reference for Languages. Bu xalqaro standart bo'lib, til bilimini 6 darajaga bo'ladi.

## A1 — Boshlang'ich (Beginner)

O'zingizni tanishtira olasiz. Oddiy savollar berasiz va javob berasiz. Kundalik iboralarni tushunasiz.

**Misol:** "Hello, my name is Akmal. I am from Uzbekistan."

## A2 — Elementar (Elementary)

Tanish mavzularda muloqot qila olasiz. Oila, xarid, ish haqida gaplasha olasiz.

## B1 — O'rta (Intermediate)

Sayohat paytida muammolarni hal qila olasiz. O'zingizga oid mavzularda fikr bildirasiz.

## B2 — O'rta yuqori (Upper-Intermediate)

Murakkab matnlarni tushunasiz. Ona tilidagi notiqlar bilan erkin muloqot qilasiz. **IELTS 6.0-7.0 darajasi.**

## C1 — Ilg'or (Advanced)

Har qanday mavzuda erkin gaplasha olasiz. Professional va akademik maqsadlar uchun til bilasiz. **IELTS 7.5-8.0 darajasi.**

## C2 — Mukammal (Proficiency)

Ona tili kabi yoki unga yaqin darajada bilasiz. **IELTS 8.5-9.0 darajasi.**

## Darajangizni aniqlang

Vokabi platformasida bepul daraja testi topshiring va o'z darajangizni bilib oling!
    `,
    related: ["ielts-7-ball-olish", "ingliz-tili-orgatish-usullari"],
  },
  "ingliz-tili-orgatish-usullari": {
    title: "Ingliz tilini o'rganishning 7 ta samarali usuli",
    emoji: "🧠",
    category: "O'rganish",
    readTime: 7,
    date: "2026-06-05",
    content: `
## Nima uchun ko'pchilik muvaffaqiyatsiz bo'ladi?

Asosiy sabab — noto'g'ri usul. Faqat grammatika kitob o'qib, haqiqiy ingliz tilini o'rganib bo'lmaydi.

## 1. Input hypothesis

Stephen Krashen nazariyasi: til o'rganish uchun ko'p **comprehensible input** kerak. Ya'ni, tushuna oladigan darajada inglizcha matn o'qing va tinglang.

## 2. Spaced Repetition

So'zlarni bir marta o'qib yodlashga urinmang. Spaced repetition — belgilangan vaqt oralig'ida takrorlash usuli. Vokabi dagi flashcard o'yinlari aynan shu tamoyilga asoslangan.

## 3. Shadowing texnikasi

Inglizcha audio tinglab, xuddi shu paytda takrorlang. Bu talaffuz va intonatsiyani tez yaxshilaydi.

## 4. Output practice

Til o'rganish faqat input bilan tugamaydi — output ham kerak. Har kuni inglizcha yozing yoki gaplashing.

## 5. Kontekst orqali o'rganish

So'zlarni lug'atdan yodlash samarasiz. So'zni real kontekstda — kitob, film, podcast da ko'rsangiz, yaxshiroq yodda qoladi.

## 6. Immersion

Agar imkon bo'lsa — inglizcha muhitga to'liq sho'ng'ing. Telefon tilini inglizchaga o'tkazing, inglizcha podcastlar tinglang.

## 7. AI bilan mashq

AI — eng sabr-toqatli o'qituvchi. Xato qilsangiz ham kulmaydi, istalgan payt javob beradi. Vokabi dagi AI Tutor orqali har kuni mashq qiling.
    `,
    related: ["vocabulary-kengaytirish", "speaking-yaxshilash", "ai-ingliz-tili"],
  },
  "speaking-yaxshilash": {
    title: "Speaking ko'nikmangizni 2 haftada yaxshilash",
    emoji: "🗣️",
    category: "Speaking",
    readTime: 5,
    date: "2026-05-28",
    content: `
## Nima uchun speaking qiyin?

Speaking — til o'rganuvchilar uchun eng qiyin ko'nikma. Sababi: bir vaqtning o'zida fikrlash, grammatika, lug'at va talaffuzni boshqarish kerak.

## 1-kun: O'zingizni yozib oling

Bugun 2 daqiqa davomida inglizcha gapiring va yozib oling. Keyinchalik tinglang — qaysi yerda to'xtadingiz? Qaysi so'zni topa olmadingiz?

## Shadowing usuli

Ingliz tilida gapiradigan kishi videosini toping. Uning har bir jumlasini xuddi shu paytda takrorlang. Dastlab sekin, keyin tezroq.

## OREO tizimi

Speaking testida javob berish uchun:
- **O** — Opinion (fikr)
- **R** — Reason (sabab)
- **E** — Example (misol)
- **O** — Opinion (xulosa)

## AI bilan kundalik mashq

Vokabi da AI bilan har kuni 10 daqiqa suhbat qiling. AI sizning grammatik xatolaringizni tuzatadi, yangi iboralar tavsiya qiladi.

## 2 hafta rejasi

- **1-3 kun:** Shadowing, kuniga 15 daqiqa
- **4-7 kun:** AI bilan suhbat, OREO tizimi
- **8-10 kun:** O'zingizni yozib, tahlil qiling
- **11-14 kun:** Mock speaking test topshiring
    `,
    related: ["ielts-7-ball-olish", "ai-ingliz-tili"],
  },
  "vocabulary-kengaytirish": {
    title: "Haftalik 100 ta yangi so'z yodlash texnikasi",
    emoji: "📚",
    category: "Vocabulary",
    readTime: 6,
    date: "2026-05-20",
    content: `
## Kuniga 15 so'z — ilmiy usul

Tadqiqotlar ko'rsatishicha, kuniga 15 ta yangi so'z o'rganish optimal. Ko'proq o'rganishga urinish — tez unutishga olib keladi.

## Spaced repetition tizimi

So'zlarni yodlashda eng samarali usul — spaced repetition:
- Yangi so'z → 1 kun keyin takror
- Bilsangiz → 3 kun keyin
- Yana bilsangiz → 1 hafta keyin
- Keyin → 2 hafta, 1 oy...

Vokabi dagi Lug'at bo'limi aynan shu tizimda ishlaydi.

## Kontekst muhim

So'zni yakka holda yodlamang. Jumlada ko'ring:
❌ "Ubiquitous — hamma joyda mavjud"
✅ "Smartphones have become ubiquitous in modern life."

## Word families

Bir so'z o'rniga so'z oilasini o'rganing:
- **Create** (fe'l) → **Creative** (sifat) → **Creativity** (ot) → **Creator** (ot)

## Akademik lug'at

IELTS va CEFR uchun **AWL** (Academic Word List) ni o'rganing. Bu 570 ta so'z akademik matnlarda eng ko'p uchraydi.

## Haftalik 100 so'z rejasi

- Dushanba-Juma: 15 ta yangi so'z (75 ta)
- Shanba: 25 ta yangi so'z
- Yakshanba: Takrorlash va test
    `,
    related: ["ingliz-tili-orgatish-usullari", "cefr-darajalari"],
  },
  "ai-ingliz-tili": {
    title: "AI bilan ingliz tili o'rganish — kelajak bu yerda",
    emoji: "🤖",
    category: "AI",
    readTime: 5,
    date: "2026-05-15",
    content: `
## AI til o'rganishni qanday o'zgartirdi?

2023 yildan beri AI texnologiyalari til o'rganishni tubdan o'zgartirdi. Endi sizga doim qo'lda tayyor turadigan, sabr-toqatli, shaxsiy o'qituvchi bor.

## AI Writing baholash

Avval writing tekshirish uchun o'qituvchi kerak edi. Endi Vokabi da AI sizning esseyingizni IELTS 4 mezon bo'yicha baholaydi:
- Task Achievement
- Coherence and Cohesion
- Lexical Resource
- Grammatical Range and Accuracy

## AI Speaking tahlil

Ovozingizni yozib, AI ga yuboring. AI talaffuz, grammatika va so'z boyligingizni tahlil qiladi.

## AI Tutor

Istalgan savol bering — AI darhol javob beradi. Grammatika, lug'at, IELTS haqida savol? 24/7 yordam.

## Shaxsiy o'quv rejasi

AI sizning darajangizni, maqsadingizni va zaif tomonlaringizni hisobga olib, shaxsiy o'quv rejasi tuzadi.

## Kelajak

AI til o'rganishni yanada samarali qiladi. Lekin asosiy narsa — sizning mehnat va ishtiyoqingiz. AI faqat vosita!
    `,
    related: ["ingliz-tili-orgatish-usullari", "speaking-yaxshilash"],
  },
};

const RELATED_TITLES: Record<string, string> = {
  "ielts-7-ball-olish": "IELTS 7 ball olish uchun 30 kunlik reja",
  "cefr-darajalari": "CEFR darajalari: A1 dan C2 gacha",
  "ingliz-tili-orgatish-usullari": "Ingliz tilini o'rganishning 7 usuli",
  "speaking-yaxshilash": "Speaking ko'nikmangizni 2 haftada yaxshilash",
  "vocabulary-kengaytirish": "Haftalik 100 ta yangi so'z yodlash",
  "ai-ingliz-tili": "AI bilan ingliz tili o'rganish",
};

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-display font-black mt-8 mb-4">{line.slice(3)}</h2>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold mb-2">{line.slice(2, -2)}</p>;
    if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 text-muted-foreground">{line.slice(2)}</li>;
    if (line.startsWith('❌') || line.startsWith('✅')) return <p key={i} className="mb-2 font-mono text-sm bg-muted/50 px-3 py-1 rounded-lg">{line}</p>;
    if (line.startsWith('- **')) {
      const parts = line.slice(2).split('**');
      return <li key={i} className="ml-4 mb-1"><strong>{parts[1]}</strong>{parts[2]}</li>;
    }
    if (line.trim() === '') return <div key={i} className="mb-2" />;
    return <p key={i} className="mb-3 leading-relaxed text-foreground/90">{line}</p>;
  });
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const post = slug ? POSTS[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📭</p>
          <h2 className="text-xl font-bold mb-2">Maqola topilmadi</h2>
          <Link to="/blog" className="text-primary hover:underline">Blogga qaytish</Link>
        </div>
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Havola nusxa olindi!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-4 py-3 max-w-3xl flex items-center justify-between">
          <button onClick={() => navigate('/blog')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Blog
          </button>
          <button onClick={share} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
            {copied ? <><Check className="w-4 h-4" /> Nusxa olindi!</> : <><Share2 className="w-4 h-4" /> Ulashish</>}
          </button>
        </div>
      </div>

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-10">
            <div className="text-6xl mb-5">{post.emoji}</div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{post.category}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{post.readTime} daqiqa</span>
              <span className="text-xs text-muted-foreground">{post.date}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black mb-4 leading-tight">{post.title}</h1>
            <div className="h-px bg-border" />
          </div>

          {/* Content */}
          <div className="prose-custom mb-12">
            {renderContent(post.content)}
          </div>

          {/* CTA */}
          <div className="rounded-3xl bg-primary/5 border border-primary/20 p-8 text-center mb-12">
            <p className="text-xl font-black mb-2">Bilimingizni sinab ko'ring! 🚀</p>
            <p className="text-muted-foreground text-sm mb-5">Vokabi da IELTS va CEFR testlarini topshiring, AI bilan mashq qiling</p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              Bepul boshlash →
            </Link>
          </div>

          {/* Related */}
          {post.related?.length > 0 && (
            <div>
              <h3 className="font-black text-lg mb-4">O'xshash maqolalar</h3>
              <div className="grid gap-3">
                {post.related.map((r: string) => (
                  <Link key={r} to={`/blog/${r}`} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group">
                    <span className="text-2xl">{POSTS[r]?.emoji}</span>
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{RELATED_TITLES[r]}</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </article>
    </div>
  );
}
