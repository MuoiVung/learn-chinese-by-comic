import { GoogleGenAI, Type, Modality } from "@google/genai";

// --- Gemini API Service ---
let ai: GoogleGenAI | null = null;
const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};


/**
 * Generates vocabulary details using the Gemini API.
 * @param words An array of Chinese words.
 * @returns A promise that resolves to an array of vocabulary items with meanings and examples.
 */
export const generateVocabularyDetails = async (words: string[]) => {
  const ai = getAi();
  const model = "gemini-2.5-flash";

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING },
        vietnameseMeaning: { type: Type.STRING },
        exampleSentence: { type: Type.STRING },
        exampleTranslation: { type: Type.STRING },
      },
      required: ['word', 'vietnameseMeaning', 'exampleSentence', 'exampleTranslation'],
    },
  };
  
  const wordList = words.join(', ');
  const prompt = `For each Chinese word in this list [${wordList}], provide a common Vietnamese meaning, a simple Chinese example sentence using the word, and a Vietnamese translation of the example. Return a JSON array of objects matching the provided schema. Ensure the 'word' field in the response exactly matches the word from the input list.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    // The response text is a JSON string, parse it.
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating vocabulary details:", error);
    throw new Error("Không thể tạo chi tiết từ vựng. Vui lòng thử lại.");
  }
};

/**
 * Generates speech from text using the Gemini TTS API.
 * @param text The text to convert to speech.
 * @returns A promise that resolves to a base64 encoded audio string.
 */
export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Không thể tạo âm thanh.");
    }
}


// --- Local Chinese Tools ---

/**
 * Converts a Chinese string to pinyin using the global pinyinPro library.
 * @param text The Chinese text.
 * @returns The pinyin representation of the text.
 */
export const getPinyin = (text: string): string => {
  if (window.pinyinPro) {
    return window.pinyinPro.pinyin(text, { toneType: 'num', v: true });
  }
  console.warn('pinyinPro library is not available.');
  return '';
};

/**
 * Segments a Chinese string into words using the global jieba library.
 * @param text The Chinese text.
 * @returns An array of words.
 */
export const segmentWords = (text: string): string[] => {
  if (window.jieba) {
    // Using cut method for more accurate word segmentation
    return window.jieba.cut(text);
  }
  console.warn('jieba library is not available.');
  return [text];
};


// --- Audio Utilities ---

// Fix: Create and export a shared AudioContext getter.
// A single AudioContext is reused for performance.
let audioContext: AudioContext | null = null;
export const getAudioContext = () => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};


/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array of the decoded data.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * @param data The raw audio data as a Uint8Array.
 * @param ctx The AudioContext to use for decoding.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for Gemini TTS).
 * @param numChannels The number of audio channels (e.g., 1 for mono).
 * @returns A promise that resolves to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Fix: Implement and export speakText function for TTS playback.
/**
 * Generates speech from text and plays it immediately.
 * @param text The text to speak.
 */
export const speakText = async (text: string): Promise<void> => {
    if (!text.trim()) return;
    try {
        const base64Audio = await generateSpeech(text);
        const ctx = getAudioContext();
        const decodedData = decode(base64Audio);
        const buffer = await decodeAudioData(decodedData, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
    } catch (error) {
        console.error(`Failed to speak text: "${text}"`, error);
        // Rethrow or handle as needed, for example, by showing a toast.
        throw new Error("Không thể phát âm thanh.");
    }
};
