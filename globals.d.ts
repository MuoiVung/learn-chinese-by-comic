// globals.d.ts

declare global {
  interface Window {
    Tesseract: any;
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