
export interface VocabularyItem {
  word: string;
  pinyin: string;
  vietnameseMeaning: string;
  exampleSentence: string;
  examplePinyin: string;
  exampleTranslation: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'error';
}

// Fix: Add RecognizedSentence interface for OCR results.
export interface RecognizedSentence {
  id: string;
  text: string;
  pinyin: string;
}

// Fix: Add ComicPage interface for comic view.
export interface ComicPage {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  sentences: RecognizedSentence[];
}
