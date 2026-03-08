export interface WordPair {
  en: string;
  uz: string;
}

export interface SpellingWord {
  word: string;
  hint: string;
  level: string;
}

export interface GrammarQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface FlashCard {
  front: string;
  back: string;
  example: string;
}

export const wordPairs: Record<string, WordPair[]> = {
  A1: [
    { en: 'apple', uz: 'olma' }, { en: 'book', uz: 'kitob' }, { en: 'cat', uz: 'mushuk' },
    { en: 'dog', uz: 'it' }, { en: 'house', uz: 'uy' }, { en: 'water', uz: 'suv' },
    { en: 'school', uz: 'maktab' }, { en: 'teacher', uz: 'o\'qituvchi' },
    { en: 'friend', uz: 'do\'st' }, { en: 'family', uz: 'oila' },
    { en: 'sun', uz: 'quyosh' }, { en: 'moon', uz: 'oy' },
  ],
  A2: [
    { en: 'knowledge', uz: 'bilim' }, { en: 'journey', uz: 'sayohat' }, { en: 'weather', uz: 'ob-havo' },
    { en: 'country', uz: 'mamlakat' }, { en: 'language', uz: 'til' }, { en: 'mountain', uz: 'tog\'' },
    { en: 'breakfast', uz: 'nonushta' }, { en: 'evening', uz: 'kechqurun' },
    { en: 'garden', uz: 'bog\'' }, { en: 'market', uz: 'bozor' },
    { en: 'holiday', uz: 'bayram' }, { en: 'problem', uz: 'muammo' },
  ],
  B1: [
    { en: 'opportunity', uz: 'imkoniyat' }, { en: 'environment', uz: 'atrof-muhit' },
    { en: 'experience', uz: 'tajriba' }, { en: 'development', uz: 'rivojlanish' },
    { en: 'education', uz: 'ta\'lim' }, { en: 'government', uz: 'hukumat' },
    { en: 'technology', uz: 'texnologiya' }, { en: 'achievement', uz: 'yutuq' },
    { en: 'confidence', uz: 'ishonch' }, { en: 'imagination', uz: 'tasavvur' },
    { en: 'responsibility', uz: 'mas\'uliyat' }, { en: 'communication', uz: 'muloqot' },
  ],
  B2: [
    { en: 'phenomenon', uz: 'hodisa' }, { en: 'consequence', uz: 'oqibat' },
    { en: 'perspective', uz: 'nuqtai nazar' }, { en: 'sustainable', uz: 'barqaror' },
    { en: 'comprehensive', uz: 'keng qamrovli' }, { en: 'significant', uz: 'muhim' },
    { en: 'inevitable', uz: 'muqarrar' }, { en: 'sophisticated', uz: 'murakkab' },
    { en: 'controversial', uz: 'bahsli' }, { en: 'fundamental', uz: 'asosiy' },
    { en: 'remarkable', uz: 'ajoyib' }, { en: 'acknowledge', uz: 'tan olmoq' },
  ],
};

export const spellingWords: Record<string, SpellingWord[]> = {
  A1: [
    { word: 'beautiful', hint: 'Very pretty', level: 'A1' },
    { word: 'important', hint: 'Having great value', level: 'A1' },
    { word: 'different', hint: 'Not the same', level: 'A1' },
    { word: 'together', hint: 'With each other', level: 'A1' },
    { word: 'remember', hint: 'Keep in mind', level: 'A1' },
    { word: 'question', hint: 'Something you ask', level: 'A1' },
    { word: 'children', hint: 'Young people', level: 'A1' },
    { word: 'favorite', hint: 'Most liked', level: 'A1' },
  ],
  B1: [
    { word: 'necessary', hint: 'Must be done', level: 'B1' },
    { word: 'experience', hint: 'Knowledge from doing', level: 'B1' },
    { word: 'independent', hint: 'Free from control', level: 'B1' },
    { word: 'environment', hint: 'Surroundings', level: 'B1' },
    { word: 'restaurant', hint: 'Place to eat', level: 'B1' },
    { word: 'government', hint: 'Rules a country', level: 'B1' },
    { word: 'temperature', hint: 'How hot or cold', level: 'B1' },
    { word: 'opportunity', hint: 'A chance', level: 'B1' },
  ],
};

export const grammarQuestions: GrammarQuestion[] = [
  { question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correct: 1, explanation: 'Third person singular uses "goes"' },
  { question: 'I ___ watching TV when he called.', options: ['was', 'were', 'am', 'is'], correct: 0, explanation: 'Past continuous with "I" uses "was"' },
  { question: 'They have ___ their homework.', options: ['do', 'did', 'done', 'doing'], correct: 2, explanation: 'Present perfect uses past participle "done"' },
  { question: 'If I ___ rich, I would travel.', options: ['am', 'was', 'were', 'be'], correct: 2, explanation: 'Second conditional uses "were" for all subjects' },
  { question: 'The book ___ by millions.', options: ['read', 'is read', 'reads', 'reading'], correct: 1, explanation: 'Passive voice: "is read"' },
  { question: 'She asked me where I ___.', options: ['live', 'lived', 'living', 'lives'], correct: 1, explanation: 'Reported speech shifts tense back' },
  { question: '___ you ever been to London?', options: ['Did', 'Have', 'Do', 'Are'], correct: 1, explanation: 'Present perfect question: "Have you ever..."' },
  { question: 'He is ___ than his brother.', options: ['tall', 'taller', 'tallest', 'more tall'], correct: 1, explanation: 'Comparative form: "taller"' },
  { question: 'I wish I ___ speak French.', options: ['can', 'could', 'will', 'would'], correct: 1, explanation: '"Wish" + past tense for unreal present' },
  { question: 'By next year, she ___ graduated.', options: ['will', 'will have', 'has', 'had'], correct: 1, explanation: 'Future perfect: "will have graduated"' },
];

export const flashcards: Record<string, FlashCard[]> = {
  A1: [
    { front: 'Accomplish', back: 'Erishmoq, bajarmoq', example: 'She accomplished her goal of learning English.' },
    { front: 'Determine', back: 'Aniqlash, hal qilish', example: 'Hard work will determine your success.' },
    { front: 'Essential', back: 'Juda muhim, zarur', example: 'Water is essential for life.' },
    { front: 'Improve', back: 'Yaxshilamoq', example: 'Practice will improve your speaking.' },
    { front: 'Support', back: 'Qo\'llab-quvvatlamoq', example: 'My family supports my studies.' },
    { front: 'Achieve', back: 'Erishmoq', example: 'You can achieve anything with effort.' },
  ],
  B1: [
    { front: 'Elaborate', back: 'Batafsil tushuntirish', example: 'Could you elaborate on that point?' },
    { front: 'Consequence', back: 'Oqibat, natija', example: 'Every action has consequences.' },
    { front: 'Perspective', back: 'Nuqtai nazar', example: 'Try to see it from my perspective.' },
    { front: 'Substantial', back: 'Sezilarli, katta', example: 'There was a substantial increase in sales.' },
    { front: 'Inevitably', back: 'Muqarrar ravishda', example: 'Change will inevitably come.' },
    { front: 'Distinguish', back: 'Farqlash', example: 'Can you distinguish between the two sounds?' },
  ],
};
