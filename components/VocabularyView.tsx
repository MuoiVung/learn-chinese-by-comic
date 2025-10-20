import React, { useState, useCallback } from 'react';
import type { FC } from 'react';
import type { VocabularyItem } from '../types';
import { SpeakerIcon, GlobeIcon } from './Icons';
// Fix: Import getAudioContext from the shared service.
import { generateSpeech, decode, decodeAudioData, getAudioContext } from '../services/chineseToolsService';


// --- Single Vocabulary Item Card ---
interface VocabularyItemCardProps {
    item: VocabularyItem;
    addToast: (message: string, type?: 'info' | 'error') => void;
}

const VocabularyItemCard: FC<VocabularyItemCardProps> = ({ item, addToast }) => {
    const [wordAudio, setWordAudio] = useState<AudioBuffer | null>(null);
    const [exampleAudio, setExampleAudio] = useState<AudioBuffer | null>(null);
    const [isLoadingWord, setIsLoadingWord] = useState(false);
    const [isLoadingExample, setIsLoadingExample] = useState(false);

    const playAudio = useCallback((buffer: AudioBuffer) => {
        try {
            const ctx = getAudioContext();
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start();
        } catch (error) {
            console.error("Error playing audio:", error);
            addToast("Lỗi khi phát âm thanh.", "error");
        }
    }, [addToast]);

    const handlePlay = useCallback(async (
        text: string, 
        audioBuffer: AudioBuffer | null, 
        setAudioBuffer: (buffer: AudioBuffer) => void, 
        setIsLoading: (loading: boolean) => void
    ) => {
        if (audioBuffer) {
            playAudio(audioBuffer);
            return;
        }
        setIsLoading(true);
        try {
            const base64Audio = await generateSpeech(text);
            const ctx = getAudioContext();
            const decodedData = decode(base64Audio);
            const buffer = await decodeAudioData(decodedData, ctx, 24000, 1);
            setAudioBuffer(buffer);
            playAudio(buffer);
        } catch (error) {
            console.error(`Failed to play audio for "${text}"`, error);
            addToast(`Không thể tạo âm thanh cho: "${text}".`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [playAudio, addToast]);

    const handleLookup = (word: string) => {
        const url = `https://hanzii.net/search/word/${encodeURIComponent(word)}?hl=vi`;
        window.open(url, '_blank');
    };

    const LoadingSpinner = () => (
        <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <li className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fade-in">
            {/* Word Section */}
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-blue-500 dark:text-blue-300 font-mono">{item.pinyin}</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{item.word}</p>
                    <p className="text-md text-slate-600 dark:text-slate-300 mt-1">{item.vietnameseMeaning}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePlay(item.word, wordAudio, setWordAudio, setIsLoadingWord)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
                        title="Phát âm từ"
                        disabled={isLoadingWord}
                    >
                        {isLoadingWord ? <LoadingSpinner /> : <SpeakerIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleLookup(item.word)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Tra từ trên Hanzii">
                        <GlobeIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Example Section */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">VÍ DỤ</p>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-blue-500 dark:text-blue-300 font-mono">{item.examplePinyin}</p>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{item.exampleSentence}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">{item.exampleTranslation}</p>
                    </div>
                    <button
                        onClick={() => handlePlay(item.exampleSentence, exampleAudio, setExampleAudio, setIsLoadingExample)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
                        title="Phát âm câu ví dụ"
                        disabled={isLoadingExample}
                    >
                         {isLoadingExample ? <LoadingSpinner /> : <SpeakerIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </li>
    );
};


// --- Main Vocabulary List ---
interface VocabularyViewProps {
  vocabulary: VocabularyItem[];
  addToast: (message: string, type?: 'info' | 'error') => void;
}

const VocabularyView: FC<VocabularyViewProps> = ({ vocabulary, addToast }) => {
    if (vocabulary.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-slate-700 dark:text-slate-300">
                Kết quả ({vocabulary.length} từ)
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vocabulary.map((item) => (
                    <VocabularyItemCard key={item.word} item={item} addToast={addToast} />
                ))}
            </ul>
        </div>
    );
};

export default VocabularyView;