export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type SkillType = 'reading' | 'listening' | 'vocabulary' | 'grammar' | 'speaking' | 'writing';

export type QuestionType = 
  | 'matching-headings'
  | 'matching-paragraph'
  | 'matching-features'
  | 'matching-endings'
  | 'multiple-choice'
  | 'list-selection'
  | 'choose-title';

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  paragraph?: string;
  imageUrl?: string;
}

export interface ReadingPassage {
  id: number;
  title: string;
  content: string;
  paragraphs?: { label: string; text: string }[];
}

export interface Part {
  id: number;
  title: string;
  instruction: string;
  passage: ReadingPassage;
  questions: Question[];
  questionType: QuestionType;
  audioUrl?: string;
  audioTranscript?: string;
}

export interface MockTest {
  id: number;
  level: CEFRLevel;
  skill: SkillType;
  parts: Part[];
  timeLimit: number; // in seconds
  audioUrl?: string;
}

export interface UserAnswer {
  questionId: number;
  partId: number;
  answer: string | string[];
}

export interface AIWritingResult {
  overallBand: number;
  criteria: {
    taskAchievement: { score: number; feedback: string };
    coherenceAndCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
  };
  overallFeedback: string;
  correctedEssay: string;
}

export interface AISpeakingResult {
  overallBand: number;
  criteria: {
    fluencyAndCoherence: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
    pronunciation: { score: number; feedback: string };
  };
  overallFeedback: string;
  suggestedResponse: string;
}

export interface TestResult {
  mockId: number;
  level: CEFRLevel;
  skill: SkillType;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  answers: {
    questionId: number;
    partId: number;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
  }[];
  timeTaken: number;
  mockTest?: MockTest;
  aiResult?: AIWritingResult | AISpeakingResult;
}

export type ViewType = 'landing' | 'levels' | 'skills' | 'vocabulary' | 'test' | 'result';
