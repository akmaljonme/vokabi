// Real word-learning activity tracking, shared between WordBank and Dashboard.
// Words themselves live in localStorage under "vokabi_wordbank" (see WordBank.tsx).
// We additionally keep a lightweight review-activity log so the Dashboard can show
// a genuine "words learned today" number without needing a backend table.

const REVIEW_LOG_KEY = "vokabi_word_review_log";
const MAX_LOG_ENTRIES = 500;

export const DAILY_WORD_GOAL = 10;

interface WordLike {
  createdAt?: string;
}

export const todayDateStr = () => new Date().toISOString().split("T")[0];

/** Call this whenever a user reviews/rates a flashcard in WordBank. */
export const logWordReview = () => {
  try {
    const raw = localStorage.getItem(REVIEW_LOG_KEY);
    const log: string[] = raw ? JSON.parse(raw) : [];
    log.push(new Date().toISOString());
    const trimmed = log.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(REVIEW_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore storage errors */
  }
};

export const getReviewsToday = (): number => {
  try {
    const raw = localStorage.getItem(REVIEW_LOG_KEY);
    const log: string[] = raw ? JSON.parse(raw) : [];
    const today = todayDateStr();
    return log.filter((ts) => ts.startsWith(today)).length;
  } catch {
    return 0;
  }
};

export const getNewWordsToday = (words: WordLike[]): number => {
  const today = todayDateStr();
  return words.filter((w) => w.createdAt?.startsWith(today)).length;
};

/** Combined "words learned today" — new words added + flashcards reviewed. */
export const getWordsLearnedToday = (words: WordLike[]): number =>
  getNewWordsToday(words) + getReviewsToday();

export const getWordBankFromStorage = (): WordLike[] => {
  try {
    const raw = localStorage.getItem("vokabi_wordbank");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
