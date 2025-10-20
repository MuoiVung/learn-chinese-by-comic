// globals.d.ts

// Fix: Add Tesseract.js type declarations to resolve TS errors.
declare namespace Tesseract {
    interface Worker {
        loadLanguage(lang: string): Promise<void>;
        initialize(lang: string): Promise<void>;
        recognize(
            image: File | string,
            options?: any,
            output?: { progress: (p: Progress) => void }
        ): Promise<{ data: { lines: { text: string }[] } }>;
        terminate(): Promise<void>;
    }

    interface Progress {
        status: string;
        progress: number;
    }

    function createWorker(options?: { logger?: (m: Progress) => void }): Promise<Worker>;
}


declare global {
  interface Window {
    pinyinPro: {
      pinyin(text: string, options: any): string;
    };
    jieba: {
      cut(text: string): string[];
    };
    // For Web Audio API compatibility
    webkitAudioContext: typeof AudioContext;
    // Fix: Add Tesseract to the window object.
    Tesseract: typeof Tesseract;
  }
}

// This export statement makes the file a module, which is required for global declarations.
export {};
