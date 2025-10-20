// globals.d.ts

// Fix: Moved Tesseract namespace inside `declare global` to make its types
// available project-wide, which is necessary because this file is a module.
// This resolves the "Cannot find namespace 'Tesseract'" errors.
declare global {
  namespace Tesseract {
    interface Worker {
      loadLanguage(lang: string): Promise<void>;
      initialize(lang: string): Promise<void>;
      recognize(
        image: ImageLike,
        options?: any,
        output?: { progress: (p: Progress) => void }
      ): Promise<RecognizeResult>;
    }

    function createWorker(options?: { logger: (m: any) => void }): Promise<Worker>;

    type ImageLike = string | File | Blob | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | Buffer;
    
    interface Progress {
      status: string;
      progress: number;
    }

    interface Line {
      text: string;
    }

    interface RecognizeResult {
      data: {
        text: string;
        lines: Line[];
      };
    }
  }


  interface Window {
    pinyinPro: {
      pinyin(text: string, options: any): string;
    };
    jieba: {
      cut(text: string): string[];
    };
    // For Web Audio API compatibility
    webkitAudioContext: typeof AudioContext;
    // Fix: Add Tesseract to window object
    Tesseract: typeof Tesseract;
  }
}

// This export statement makes the file a module, which is required for global declarations.
export {};