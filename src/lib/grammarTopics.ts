export interface GrammarTopic {
  key: string;
  title: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  description: string;
}

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  // A1
  { key: "to-be", title: "To Be (am/is/are)", level: "A1", description: "Bo'lmoq fe'lining hozirgi zamondagi shakllari" },
  { key: "present-simple", title: "Present Simple", level: "A1", description: "Doimiy va odatiy harakatlar haqida gapirish" },
  { key: "articles", title: "Articles (a/an/the)", level: "A1", description: "Aniqlik va noaniqlik artikllari" },
  { key: "plural-nouns", title: "Plural Nouns", level: "A1", description: "Otlarning ko'plik shakllari" },
  { key: "possessive-adjectives", title: "Possessive Adjectives", level: "A1", description: "my, your, his, her, its, our, their" },
  { key: "prepositions-place", title: "Prepositions of Place", level: "A1", description: "in, on, at, under, next to va h.k." },

  // A2
  { key: "present-continuous", title: "Present Continuous", level: "A2", description: "Hozir sodir bo'layotgan harakatlar" },
  { key: "past-simple", title: "Past Simple", level: "A2", description: "O'tgan zamondagi tugallangan harakatlar" },
  { key: "comparatives-superlatives", title: "Comparatives & Superlatives", level: "A2", description: "Sifatlarni qiyoslash: bigger, the biggest" },
  { key: "countable-uncountable", title: "Countable & Uncountable Nouns", level: "A2", description: "Sanaladigan va sanalmaydigan otlar, some/any" },
  { key: "prepositions-time", title: "Prepositions of Time", level: "A2", description: "in, on, at vaqt ma'nosida" },
  { key: "there-is-are", title: "There is / There are", level: "A2", description: "Mavjudlikni bildirish" },

  // B1
  { key: "present-perfect", title: "Present Perfect", level: "B1", description: "O'tmish bilan hozirgi zamon bog'liqligi" },
  { key: "past-continuous", title: "Past Continuous", level: "B1", description: "O'tmishda davom etayotgan harakat" },
  { key: "future-forms", title: "Future (will / going to)", level: "B1", description: "Kelasi zamon shakllari va ulardagi farq" },
  { key: "modal-verbs-1", title: "Modal Verbs: can, must, should", level: "B1", description: "Imkoniyat, majburiyat, tavsiya" },
  { key: "first-conditional", title: "First Conditional", level: "B1", description: "Real kelajak shartlari: If + present, will" },
  { key: "gerunds-infinitives-1", title: "Gerunds vs Infinitives (asoslar)", level: "B1", description: "-ing va to + fe'l qachon ishlatiladi" },

  // B2
  { key: "present-perfect-continuous", title: "Present Perfect Continuous", level: "B2", description: "Davom etayotgan va hozirgacha davom etgan harakat" },
  { key: "past-perfect", title: "Past Perfect", level: "B2", description: "O'tmishdagi ikki harakatning tartibi" },
  { key: "second-conditional", title: "Second Conditional", level: "B2", description: "Hayoliy hozirgi/kelajak shartlar" },
  { key: "passive-voice", title: "Passive Voice", level: "B2", description: "Majhul nisbat: is/was + V3" },
  { key: "reported-speech", title: "Reported Speech", level: "B2", description: "O'zganing gapini ko'chirib aytish" },
  { key: "relative-clauses", title: "Relative Clauses", level: "B2", description: "who, which, that, whose bilan bog'lovchi gaplar" },

  // C1
  { key: "third-conditional", title: "Third Conditional", level: "C1", description: "O'tmishdagi hayoliy shartlar" },
  { key: "mixed-conditionals", title: "Mixed Conditionals", level: "C1", description: "Aralash shart gaplari" },
  { key: "gerunds-infinitives-2", title: "Gerunds vs Infinitives (chuqur)", level: "C1", description: "Ma'no farqi: stop doing vs stop to do" },
  { key: "inversion", title: "Inversion", level: "C1", description: "Ta'kid uchun so'z tartibini o'zgartirish" },
  { key: "cleft-sentences", title: "Cleft Sentences", level: "C1", description: "It is... that / What... is gap qurilishlari" },

  // C2
  { key: "subjunctive", title: "Subjunctive Mood", level: "C2", description: "Buyruq, tavsiya, istak ifodalovchi maxsus shakl" },
  { key: "advanced-passive", title: "Advanced Passive Structures", level: "C2", description: "It is said that... / He is believed to..." },
  { key: "nominalization", title: "Nominalization", level: "C2", description: "Fe'l va sifatlarni ot shakliga o'tkazish (akademik uslub)" },
];

export const GRAMMAR_LEVELS: GrammarTopic["level"][] = ["A1", "A2", "B1", "B2", "C1", "C2"];
