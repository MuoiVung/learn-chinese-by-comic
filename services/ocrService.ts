// Fix: Implement the OCR service to correctly process images and resolve module errors.
import type { RecognizedSentence } from '../types';
import { getPinyin } from './chineseToolsService';

// A single worker instance is reused to avoid the costly re-initialization.
// A promise is used to handle concurrent calls while the worker is initializing.
let worker: Tesseract.Worker | null = null;
let workerInitializationPromise: Promise<Tesseract.Worker> | null = null;

/**
 * Initializes the Tesseract.js worker, loading the Chinese language model.
 * This function is memoized to ensure it only runs once.
 * @param onProgress A callback to report initialization progress.
 * @returns A promise that resolves with the initialized Tesseract worker.
 */
const initializeWorker = (onProgress: (p: { status: string; progress: number }) => void): Promise<Tesseract.Worker> => {
    if (workerInitializationPromise) {
        return workerInitializationPromise;
    }

    if (!window.Tesseract) {
        return Promise.reject(new Error('Tesseract.js is not loaded.'));
    }

    workerInitializationPromise = (async () => {
        worker = await window.Tesseract.createWorker({
            logger: onProgress,
        });
        await worker.loadLanguage('chi_sim');
        await worker.initialize('chi_sim');
        return worker;
    })();

    return workerInitializationPromise;
};


/**
 * Performs OCR on an image file to extract Chinese sentences.
 * @param file The image file to process.
 * @param onProgress A callback to report OCR progress (0 to 1).
 * @returns A promise that resolves to an array of recognized sentences.
 */
export const performOcr = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<RecognizedSentence[]> => {
    try {
        const tesseractWorker = await initializeWorker((m) => {
            // Initialization phase (loading models, etc.) is treated as the first 50% of progress.
            if (m.status === 'loading language model' || m.status === 'initializing api') {
                onProgress(m.progress * 0.5);
            }
        });

        const { data: { lines } } = await tesseractWorker.recognize(
            file,
            {},
            {
                progress: (p) => {
                    // Text recognition phase is the second 50%.
                    if (p.status === 'recognizing text') {
                        onProgress(0.5 + p.progress * 0.5);
                    }
                }
            }
        );

        const sentences: RecognizedSentence[] = lines
            // Clean up each line of text.
            .map(line => line.text.trim().replace(/\s/g, ''))
            // Filter out empty lines or lines without Chinese characters.
            .filter(text => text.length > 0 && /[一-龥]/.test(text)) 
            .map((text, index) => ({
                id: `${file.name}-${index}-${Date.now()}`,
                text,
                pinyin: getPinyin(text),
            }));

        return sentences;
    } catch (error) {
        console.error('OCR process failed:', error);
        // Reset the promise on failure to allow subsequent attempts to re-initialize.
        workerInitializationPromise = null;
        worker = null;
        throw error;
    }
};
