export type OcrStatus = 'pending' | 'processing' | 'done' | 'error';

export interface RecognizedSentence {
  id: string;
  text: string;
  pinyin: string;
}

export interface ComicPage {
  id: string;
  file: File;
  url: string;
  status: OcrStatus;
  progress: number;
  sentences: RecognizedSentence[];
}

export interface VocabularyItem {
  word: string;
  pinyin: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'error';
}
