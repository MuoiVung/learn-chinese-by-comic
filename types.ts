export interface VocabularyItem {
  word: string;
  pinyin: string;
  vietnameseMeaning: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export interface PracticeQuestion {
  type: 'multiple-choice' | 'fill-in-the-blank' | 'listening';
  word: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Exercise {
  title: string;
  questions: PracticeQuestion[];
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'error';
}

export interface StorySegment {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface StoryResult {
  title: string;
  segments: StorySegment[];
  vocabulary: VocabularyItem[];
}

// Added for Reading Comprehension feature
export interface ReadingComprehensionOption {
  optionText: string;
  optionTranslation: string;
  pinyin: string;
}

export interface ReadingComprehensionQuestion {
  questionText: string;
  questionPinyin: string;
  questionTranslation: string;
  options: ReadingComprehensionOption[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ReadingComprehensionExercise {
  questions: ReadingComprehensionQuestion[];
}

// Added for Grammar feature
export interface GrammarExample {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface GrammarExplanation {
  meaning: string;
  structure: string;
  examples: GrammarExample[];
}

export interface GrammarExercise {
  type: 'fill-in-the-blank' | 'sentence-ordering';
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string; // Add explanation for incorrect answers
}

export interface GrammarPoint {
  name: string;
  explanation: GrammarExplanation;
  exercises: GrammarExercise[];
}

export interface GrammarAnalysisResult {
  mainTopics: GrammarPoint[];
  secondaryTopics: GrammarPoint[];
}