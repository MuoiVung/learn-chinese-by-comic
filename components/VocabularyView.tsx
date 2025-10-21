import React, { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import type { VocabularyItem } from '../types';
import { generateVocabulary, fetchAudioData, getAudioContext } from '../services/chineseToolsService';
import { SparklesIcon, BookmarkIcon } from './Icons';
import { AudioButton, LoadingSpinner } from './Shared';
import { useOnScreen } from '../hooks/useOnScreen';

const VocabListItem: FC<{
  item: VocabularyItem;
  isSaved: boolean;
  onToggleSave: (item: VocabularyItem) => void;
  addToast: (message: string, type?: 'info' | 'error') => void;
  onVisible: () => void;
  audioBuffers: Map<string, AudioBuffer>;
  loadingAudio: Set<string>;
}> = ({ item, isSaved, onToggleSave, addToast, onVisible, audioBuffers, loadingAudio }) => {
  const [ref, isVisible] = useOnScreen<HTMLLIElement>({ rootMargin: '100px' });
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (isVisible && !hasBeenVisible) {
      onVisible();
      setHasBeenVisible(true);
    }
  }, [isVisible, hasBeenVisible, onVisible]);

  return (
    <li ref={ref} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-xl text-slate-800 dark:text-slate-100">{item.word}</p>
            <AudioButton 
              textToSpeak={item.word} 
              addToast={addToast}
              preloadedBuffer={audioBuffers.get(item.word)}
              isPreloading={loadingAudio.has(item.word)}
            />
          </div>
          <p className="text-blue-500 dark:text-blue-400 font-mono">{item.pinyin}</p>
          <p className="text-slate-600 dark:text-slate-300 mt-1">{item.vietnameseMeaning}</p>
        </div>
        <button
          onClick={() => onToggleSave(item)}
          className={`p-2 rounded-full transition-colors ${
            isSaved
              ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-700'
              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-100 dark:hover:bg-slate-700'
          }`}
          title={isSaved ? "Bỏ lưu" : "Lưu từ"}
        >
          <BookmarkIcon className="w-6 h-6" solid={isSaved} />
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ví dụ:</p>
        <div className="flex items-center gap-2">
          <p className="text-slate-700 dark:text-slate-200 flex-grow">{item.exampleSentence}</p>
          <AudioButton 
            textToSpeak={item.exampleSentence} 
            addToast={addToast}
            preloadedBuffer={audioBuffers.get(item.exampleSentence)}
            isPreloading={loadingAudio.has(item.exampleSentence)}
          />
        </div>
        <p className="text-slate-500 dark:text-slate-400 italic text-sm">{item.exampleTranslation}</p>
      </div>
    </li>
  );
};


interface VocabularyViewProps {
  savedList: VocabularyItem[];
  onToggleSave: (item: VocabularyItem) => void;
  addToast: (message: string, type?: 'info' | 'error') => void;
  externalVocab?: VocabularyItem[] | null;
  title?: string;
}

const VocabularyView: FC<VocabularyViewProps> = ({ savedList, onToggleSave, addToast, externalVocab = null, title = "Kết quả" }) => {
    const [inputText, setInputText] = useState('');
    const [level, setLevel] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedVocab, setGeneratedVocab] = useState<VocabularyItem[]>([]);
    
    const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
    const [loadingAudio, setLoadingAudio] = useState<Set<string>>(new Set());

    const vocabList = externalVocab ?? generatedVocab;

    useEffect(() => {
        // Clear audio cache when the list changes
        setAudioBuffers(new Map());
        setLoadingAudio(new Set());
    }, [vocabList]);

    const preloadAudioForItem = useCallback(async (item: VocabularyItem) => {
        const textsToLoad = [item.word, item.exampleSentence].filter(text => 
            text && !audioBuffers.has(text) && !loadingAudio.has(text)
        );

        if (textsToLoad.length === 0) return;

        setLoadingAudio(prev => new Set([...prev, ...textsToLoad]));

        try {
            const audioCtx = getAudioContext();
            const promises = textsToLoad.map(text => fetchAudioData(text, audioCtx).catch(e => null));
            const results = await Promise.all(promises);

            setAudioBuffers(prev => {
                const newMap = new Map(prev);
                textsToLoad.forEach((text, i) => {
                    if (results[i]) newMap.set(text, results[i] as AudioBuffer);
                });
                return newMap;
            });
        } catch (e) {
            console.error("Failed to preload audio for item:", item.word, e);
        } finally {
            setLoadingAudio(prev => {
                const newSet = new Set(prev);
                textsToLoad.forEach(text => newSet.delete(text));
                return newSet;
            });
        }
    }, [audioBuffers, loadingAudio]);

    const handleGenerate = async () => {
        if (!inputText.trim()) {
            addToast('Vui lòng nhập văn bản để tạo từ vựng.', 'info');
            return;
        }
        setIsLoading(true);
        setGeneratedVocab([]);
        try {
            const vocab = await generateVocabulary(inputText, level);
            setGeneratedVocab(vocab);
        } catch (error: any) {
            addToast(error.message || 'Không thể tạo từ vựng.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isSaved = (item: VocabularyItem) => {
        return savedList.some(savedItem => savedItem.word === item.word);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {!externalVocab && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Tạo Từ Vựng từ Văn Bản</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Nhập một đoạn văn bản tiếng Việt, AI sẽ trích xuất các từ vựng tiếng Trung liên quan.
                    </p>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="mt-4 w-full h-32 p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        placeholder="Ví dụ: Tôi muốn đi đến siêu thị để mua một ít hoa quả."
                    />
                     <div className="mt-4">
                        <label htmlFor="level-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cấp độ từ vựng</label>
                        <select
                            id="level-select"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full md:w-auto p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        >
                            <option value="all">Tất cả</option>
                            <option value="suggested">Gợi ý</option>
                            <option value="tocfl1">TOCFL 1+</option>
                            <option value="tocfl2">TOCFL 2+</option>
                            <option value="tocfl3">TOCFL 3+</option>
                            <option value="tocfl4">TOCFL 4+</option>
                            <option value="tocfl5">TOCFL 5+</option>
                            <option value="tocfl6">TOCFL 6</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all disabled:bg-slate-400 disabled:cursor-wait"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                Tạo từ vựng
                            </>
                        )}
                    </button>
                </div>
            )}


            {vocabList.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-300">
                        {title}
                    </h3>
                    <ul className="space-y-3">
                        {vocabList.map(item => (
                           <VocabListItem
                                key={item.word}
                                item={item}
                                isSaved={isSaved(item)}
                                onToggleSave={onToggleSave}
                                addToast={addToast}
                                onVisible={() => preloadAudioForItem(item)}
                                audioBuffers={audioBuffers}
                                loadingAudio={loadingAudio}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default VocabularyView;
