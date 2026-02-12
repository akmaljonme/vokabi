export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type SkillType = 'reading' | 'listening' | 'vocabulary' | 'grammar';

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
}

export type ViewType = 'landing' | 'levels' | 'skills' | 'vocabulary' | 'test' | 'result';
