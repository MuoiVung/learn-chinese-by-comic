// globals.d.ts

declare global {
  interface Window {
    jieba: {
      cut(text: string): string[];
    };
    // For Web Audio API compatibility
    webkitAudioContext: typeof AudioContext;
  }
}

// This export statement makes the file a module, which is required for global declarations.
export {};
