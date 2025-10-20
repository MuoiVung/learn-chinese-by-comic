// globals.d.ts

// Fix: Add type definitions for Tesseract.js to resolve "Cannot find namespace 'Tesseract'" errors.
// These minimal types are based on the usage in `services/ocrService.ts`.
declare namespace Tesseract {
  interface RecognizeResult {
    data: {
      lines: { text: string }[];
    };
  }

  interface Worker {
    loadLanguage(langs: string): Promise<void>;
    initialize(langs: string): Promise<void>;
    recognize(
      image: File,
      options: {},
      output?: { progress: (p: { status: string; progress: number }) => void }
    ): Promise<RecognizeResult>;
  }
}

declare global {
  interface Window {
    Tesseract: {
      createWorker(options?: any): Promise<Tesseract.Worker>;
    };
    pinyinPro: any;
    jieba: any;
    responsiveVoice: {
      speak: (text: string, voice: string, options?: object) => void;
      getVoices: () => any[];
      cancel: () => void;
    };
    responsiveVoice_onvoicesloaded?: () => void;
  }
}

// This export statement makes the file a module, which is required for global declarations.
export {};
