export interface Language {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  color: string;
  levels: string[];
  alphabet: string;
  difficulty: 'easy' | 'medium' | 'hard';
  speakers: string;
  greeting: string;
  commonPhrases: { phrase: string; translation: string; pronunciation: string }[];
}

export const LANGUAGES: Language[] = [
  {
    id: "english",
    name: "Ingliz tili",
    nativeName: "English",
    flag: "🇬🇧",
    color: "from-blue-600 to-blue-400",
    levels: ["A1","A2","B1","B2","C1","C2"],
    alphabet: "Lotin",
    difficulty: "medium",
    speakers: "1.5 mlrd",
    greeting: "Hello!",
    commonPhrases: [
      { phrase: "Hello!", translation: "Salom!", pronunciation: "HEL-oh" },
      { phrase: "Thank you", translation: "Rahmat", pronunciation: "THANK yoo" },
      { phrase: "How are you?", translation: "Qanaqasiz?", pronunciation: "haw ar yoo" },
      { phrase: "Good morning", translation: "Xayrli tong", pronunciation: "gud MOR-ning" },
      { phrase: "Goodbye", translation: "Xayr", pronunciation: "gud-BY" },
    ],
  },
];

export const getLanguageById = (id: string) => LANGUAGES.find(l => l.id === id);
export const difficultyLabel = (d: Language['difficulty']) =>
  d === 'easy' ? 'Oson' : d === 'medium' ? "O'rta" : 'Qiyin';
export const difficultyColor = (d: Language['difficulty']) =>
  d === 'easy' ? 'text-green-500' : d === 'medium' ? 'text-yellow-500' : 'text-red-500';
