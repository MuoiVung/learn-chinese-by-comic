import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { VocabularyItem, PracticeQuestion, StoryResult, ReadingComprehensionExercise } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// Helper function to decode base64 to Uint8Array
const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// Helper function to decode raw PCM data into an AudioBuffer
const decodeRawAudioData = async (ctx: AudioContext, data: Uint8Array): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length; // single channel
    const buffer = ctx.createBuffer(1, frameCount, 24000); // 1 channel, 24k sample rate

    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
};

export const fetchAudioData = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    const ttsModel = 'gemini-2.5-flash-preview-tts';
    // FIX: Use a more robust, complete sentence prompt in Chinese to ensure the TTS model
    // always understands the context, even for single, potentially ambiguous words.
    const prompt = `请朗读以下内容：'${text}'`;
    const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: prompt }] }],
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
        throw new Error("No audio data received from API.");
    }
    const audioBytes = decode(base64Audio);
    return decodeRawAudioData(audioContext, audioBytes);
};

// FIX: Add a shared AudioContext and the missing speakText function.
let audioContext: AudioContext | null = null;
export const getAudioContext = () => {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
};

// Helper to play a pre-fetched AudioBuffer.
// Returns the source node so it can be stopped if needed.
export const playAudioBuffer = (buffer: AudioBuffer, context: AudioContext): AudioBufferSourceNode => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    return source;
};

export const speakText = async (text: string): Promise<void> => {
    const audioCtx = getAudioContext();
    const buffer = await fetchAudioData(text, audioCtx);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    
    return new Promise(resolve => {
        source.onended = () => {
            resolve();
        };
        source.start(0);
    });
};


export const generateVocabulary = async (text: string, level: string): Promise<VocabularyItem[]> => {
    let levelInstruction = "Extract all key vocabulary words and phrases.";
    if (level.startsWith('tocfl')) {
        const levelNum = level.replace('tocfl', '');
        levelInstruction = `Extract all key vocabulary words and phrases that are at or above TOCFL level ${levelNum} (e.g., if level 4 is chosen, include levels 4, 5, and 6).`;
    } else if (level === 'suggested') {
        levelInstruction = "Analyze the text and suggest up to 10 of the most important or difficult words for an intermediate learner."
    }

    const prompt = `
      From the following Vietnamese text, ${levelInstruction}
      For each one, provide the Chinese translation, pinyin with tone marks (e.g., wǒ), and a simple example sentence in Chinese with its Vietnamese translation.
      The text is: "${text}"
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    vocabulary: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING, description: "The Chinese word or phrase." },
                                pinyin: { type: Type.STRING, description: "The Pinyin transcription with tone marks." },
                                vietnameseMeaning: { type: Type.STRING, description: "The Vietnamese meaning of the word." },
                                exampleSentence: { type: Type.STRING, description: "An example sentence in Chinese using the word." },
                                exampleTranslation: { type: Type.STRING, description: "The Vietnamese translation of the example sentence." },
                            },
                            required: ['word', 'pinyin', 'vietnameseMeaning', 'exampleSentence', 'exampleTranslation'],
                        }
                    }
                },
                required: ['vocabulary']
            },
        },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        return result.vocabulary || [];
    } catch (e) {
        console.error("Failed to parse vocabulary response:", jsonText, e);
        throw new Error("Không thể tạo từ vựng. Phản hồi từ AI không hợp lệ.");
    }
};

export const generatePracticeExercises = async (vocabList: VocabularyItem[]): Promise<{ title: string; questions: PracticeQuestion[] }> => {
  const words = vocabList.map(v => `${v.word} (${v.pinyin}): ${v.vietnameseMeaning}`).join(', ');

  const prompt = `
    Based on the following list of Chinese vocabulary words, create a practice exercise with ${Math.min(vocabList.length, 10)} questions.
    The list is: ${words}.
    The exercise should include a mix of the following question types:
    1. 'multiple-choice': Given a Chinese word, choose the correct Vietnamese meaning from 4 options. The 'word' field should contain the Chinese word to be quizzed.
    2. 'fill-in-the-blank': Given an example sentence in Chinese with the vocabulary word blanked out (using "___"), choose the correct word to fill in the blank from 4 options. The options should be Chinese words from the list. The questionText should be the full sentence with "___". The 'word' field should be the correct Chinese word.
    3. 'listening': The user will hear a word and must type it. The questionText should be "Nghe và gõ lại từ bạn nghe được.". The 'word' field should be the Chinese word to speak and check against.

    Make sure the questions are varied and cover different words from the list.
    For multiple-choice and fill-in-the-blank questions, provide 4 options and indicate the correct answer index.
    For listening questions, the options array can be empty and correctAnswerIndex should be 0.
  `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A title for the practice session, e.g., 'Bài tập luyện từ vựng'." },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, enum: ['multiple-choice', 'fill-in-the-blank', 'listening'] },
                                word: { type: Type.STRING, description: "The target Chinese word for the question." },
                                questionText: { type: Type.STRING, description: "The text of the question to display to the user." },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 options for multiple-choice or fill-in-the-blank. Empty for listening." },
                                correctAnswerIndex: { type: Type.INTEGER, description: "The 0-based index of the correct answer in the options array. 0 for listening." },
                            },
                            required: ['type', 'word', 'questionText', 'options', 'correctAnswerIndex'],
                        },
                    },
                },
                required: ['title', 'questions'],
            },
        },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        if (result && result.questions) {
            return result;
        } else {
            throw new Error("Invalid response structure from AI.");
        }
    } catch (e) {
        console.error("Failed to parse AI response:", jsonText, e);
        throw new Error("Không thể tạo bài tập. Phản hồi từ AI không hợp lệ.");
    }
};

export const generateStory = async (topic: string, vocabLevel: string): Promise<StoryResult> => {
    let levelInstruction = "The story should contain a variety of vocabulary.";
    if (vocabLevel.startsWith('tocfl')) {
        const levelNum = vocabLevel.replace('tocfl', '');
        levelInstruction = `The story should primarily use vocabulary at or above TOCFL level ${levelNum}. Then, from the generated story, extract all vocabulary at or above TOCFL level ${levelNum}.`;
    }

    const prompt = `
        You are an AI assistant for language learners. Your task is to generate a short, engaging story in Chinese and then extract relevant vocabulary from it.

        **Story Generation Task:**
        - Write a short story in Chinese.
        - Topic: "${topic}"
        - The story should be broken down into natural segments (paragraphs).
        - For each segment, provide the Chinese text, the Pinyin transcription with tone marks, and a Vietnamese translation.
        
        **Vocabulary Extraction Task:**
        - ${levelInstruction}
        - For each extracted vocabulary word, provide its Pinyin, Vietnamese meaning, an example sentence (which must be the sentence from the story where the word appeared), and the Vietnamese translation of that example sentence.

        Return the entire output as a single JSON object.
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The Chinese title of the story." },
                    segments: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                chinese: { type: Type.STRING, description: "A segment of the story in Chinese characters." },
                                pinyin: { type: Type.STRING, description: "The Pinyin transcription for the segment." },
                                vietnamese: { type: Type.STRING, description: "The Vietnamese translation of the segment." },
                            },
                            required: ['chinese', 'pinyin', 'vietnamese'],
                        }
                    },
                    vocabulary: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING, description: "The Chinese word or phrase." },
                                pinyin: { type: Type.STRING, description: "The Pinyin transcription with tone marks." },
                                vietnameseMeaning: { type: Type.STRING, description: "The Vietnamese meaning of the word." },
                                exampleSentence: { type: Type.STRING, description: "The sentence from the story where the word appeared." },
                                exampleTranslation: { type: Type.STRING, description: "The Vietnamese translation of the example sentence." },
                            },
                            required: ['word', 'pinyin', 'vietnameseMeaning', 'exampleSentence', 'exampleTranslation'],
                        }
                    }
                },
                required: ['title', 'segments', 'vocabulary']
            },
        },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        if (result && result.title && result.segments && result.vocabulary) {
            return result;
        }
        throw new Error("Invalid story structure from AI.");
    } catch (e) {
        console.error("Failed to parse story response:", jsonText, e);
        throw new Error("Không thể tạo truyện. Phản hồi từ AI không hợp lệ.");
    }
};

export const generateReadingComprehension = async (text: string): Promise<ReadingComprehensionExercise> => {
    const prompt = `
      Based on the following Traditional Chinese text, please perform the following tasks and return the result as a single JSON object:
      1.  Create 5 multiple-choice questions in Traditional Chinese that test the comprehension of the text.
      2.  For each question, provide 4 possible options (A, B, C, D) in Traditional Chinese.
      3.  Indicate the correct answer for each question.
      4.  Provide a Vietnamese translation for each question and for each of the 4 options.
      5.  For each question, provide a clear explanation in Vietnamese explaining why the chosen answer is correct, referencing the original text.

      The text is: "${text}"
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                questionText: { type: Type.STRING, description: "The question in Traditional Chinese." },
                                questionTranslation: { type: Type.STRING, description: "The Vietnamese translation of the question." },
                                options: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            optionText: { type: Type.STRING, description: "The option text in Traditional Chinese." },
                                            optionTranslation: { type: Type.STRING, description: "The Vietnamese translation of the option." },
                                        },
                                        required: ['optionText', 'optionTranslation'],
                                    }
                                },
                                correctAnswerIndex: { type: Type.INTEGER, description: "The 0-based index of the correct answer." },
                                explanation: { type: Type.STRING, description: "The explanation in Vietnamese." },
                            },
                            required: ['questionText', 'questionTranslation', 'options', 'correctAnswerIndex', 'explanation'],
                        }
                    }
                },
                required: ['questions']
            },
        },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        if (result && result.questions && result.questions.length > 0) {
            return result;
        }
        throw new Error("Invalid comprehension exercise structure from AI.");
    } catch (e) {
        console.error("Failed to parse reading comprehension response:", jsonText, e);
        throw new Error("Không thể tạo bài tập đọc hiểu. Phản hồi từ AI không hợp lệ.");
    }
};
