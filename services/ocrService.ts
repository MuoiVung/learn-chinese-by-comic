// @ts-nocheck

import type { ComicPage } from '../types';

// This service wraps the global Tesseract library loaded from CDN.
// The `// @ts-nocheck` is used because TypeScript can't see the global Tesseract variable at compile time.

let workerPromise: Promise<Tesseract.Worker> | null = null;

/**
 * Initializes the Tesseract worker singleton.
 * This ensures the worker is created and initialized only once.
 * @returns A promise that resolves with the initialized Tesseract worker.
 */
const getWorker = (): Promise<Tesseract.Worker> => {
  if (workerPromise) {
    return workerPromise;
  }
  
  workerPromise = (async () => {
    const worker = await Tesseract.createWorker({
        logger: m => console.log(m), 
    });
    await worker.loadLanguage('chi_tra');
    await worker.initialize('chi_tra');
    return worker;
  })();
  
  return workerPromise;
};

/**
 * Kicks off the OCR worker initialization process in the background.
 * Call this when the app loads to pre-load language data.
 */
export const initializeOcrWorker = () => {
    getWorker();
};

/**
 * Recognizes Chinese text from an image file.
 * @param page The ComicPage object containing the image file.
 * @param onProgress A callback function to report OCR progress.
 * @returns A promise that resolves with the OCR result from Tesseract.
 */
export const recognizeText = async (
  page: ComicPage,
  onProgress: (progress: number) => void
): Promise<Tesseract.RecognizeResult> => {
  const tesseractWorker = await getWorker();
  
  const result = await tesseractWorker.recognize(page.file, {}, {
    'progress': (p) => {
        if (p.status === 'recognizing text') {
            onProgress(p.progress);
        }
    }
  });
  
  return result;
};
