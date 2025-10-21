import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { generateStory, fetchAudioData, getAudioContext, playAudioBuffer } from '../services/chineseToolsService';
import type { StoryResult, VocabularyItem, StorySegment } from '../types';
import { BookOpenIcon, SpeakerIcon, PlayIcon, StopIcon } from './Icons';
import { LoadingSpinner } from './Shared';
import VocabularyView from './VocabularyView';
import { useOnScreen } from '../hooks/useOnScreen';


const StorySegmentItem: FC<{
    segment: StorySegment;
    index: number;
    onVisible: () => void;
    onPlay: () => void;
    isPlaying: boolean;
    isAudioReady: boolean;
    isLoadingAudio: boolean;
}> = ({ segment, index, onVisible, onPlay, isPlaying, isAudioReady, isLoadingAudio }) => {

    const [ref, isVisible] = useOnScreen<HTMLDivElement>({ rootMargin: '100px' });
    const [hasBeenVisible, setHasBeenVisible] = useState(false);

    useEffect(() => {
        if (isVisible && !hasBeenVisible) {
            onVisible();
            setHasBeenVisible(true);
        }
    }, [isVisible, hasBeenVisible, onVisible]);

    return (
        <div ref={ref}
            className={`p-4 border-l-4 rounded-r-lg transition-all duration-300 ${isPlaying ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-blue-500 bg-slate-50 dark:bg-slate-900/50'}`}
        >
            <div className="flex items-center gap-2 mb-2">
                <p className="text-xl text-slate-800 dark:text-slate-100 flex-grow">{segment.chinese}</p>
                <button
                    onClick={onPlay}
                    disabled={!isAudioReady && !isLoadingAudio}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
                >
                    {isLoadingAudio ? <LoadingSpinner className="w-5 h-5 text-slate-500" /> : <SpeakerIcon className="w-5 h-5" />}
                </button>
            </div>
            <p className="font-mono text-blue-500 dark:text-blue-400 mb-2">{segment.pinyin}</p>
            <p className="text-slate-600 dark:text-slate-400 italic">{segment.vietnamese}</p>
        </div>
    );
}

interface StoryGeneratorViewProps {
    addToast: (message: string, type?: 'info' | 'error') => void;
    savedList: VocabularyItem[];
    onToggleSave: (item: VocabularyItem) => void;
}

const StoryGeneratorView: FC<StoryGeneratorViewProps> = ({ addToast, savedList, onToggleSave }) => {
    const [topic, setTopic] = useState('');
    const [vocabLevel, setVocabLevel] = useState('tocfl3');
    const [isLoading, setIsLoading] = useState(false);
    const [storyResult, setStoryResult] = useState<StoryResult | null>(null);
    
    // Audio playback state
    const [audioBuffers, setAudioBuffers] = useState<Map<number, AudioBuffer>>(new Map());
    const [loadingAudioSegments, setLoadingAudioSegments] = useState<Set<number>>(new Set());
    const [currentlyPlayingSegment, setCurrentlyPlayingSegment] = useState<number | null>(null);
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const isPlayingAllRef = useRef(isPlayingAll);
    
    useEffect(() => {
        isPlayingAllRef.current = isPlayingAll;
    }, [isPlayingAll]);


    const handleGenerate = async () => {
        if (!topic.trim()) {
            addToast('Vui lòng nhập chủ đề cho câu chuyện.', 'info');
            return;
        }
        setIsLoading(true);
        setStoryResult(null);
        setAudioBuffers(new Map());
        setLoadingAudioSegments(new Set());

        try {
            const result = await generateStory(topic, vocabLevel);
            setStoryResult(result);
        } catch (error: any) {
            addToast(error.message || 'Không thể tạo truyện.', 'error');
            setStoryResult(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const preloadAudioForSegment = useCallback(async (segment: StorySegment, index: number) => {
        if (audioBuffers.has(index) || loadingAudioSegments.has(index)) return;

        setLoadingAudioSegments(prev => new Set(prev).add(index));
        try {
            const audioCtx = getAudioContext();
            const buffer = await fetchAudioData(segment.chinese, audioCtx);
            setAudioBuffers(prev => new Map(prev).set(index, buffer));
        } catch (e) {
            console.error(`Failed to preload audio for segment ${index}`, e);
        } finally {
            setLoadingAudioSegments(prev => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
            });
        }
    }, [audioBuffers, loadingAudioSegments]);

    const handlePlaySingleSegment = (index: number) => {
        setIsPlayingAll(false); 
        if (sourceNodeRef.current) {
             sourceNodeRef.current.stop();
        }
        const buffer = audioBuffers.get(index);
        if (buffer) {
            const audioCtx = getAudioContext();
            setCurrentlyPlayingSegment(index);
            const source = playAudioBuffer(buffer, audioCtx);
            source.onended = () => setCurrentlyPlayingSegment(null);
            sourceNodeRef.current = source;
        }
    };

    const playSegmentsSequentially = useCallback(async (index: number) => {
        if (!isPlayingAllRef.current || index >= (storyResult?.segments.length ?? 0)) {
            setIsPlayingAll(false);
            setCurrentlyPlayingSegment(null);
            return;
        }
        
        let buffer = audioBuffers.get(index);
        
        if (!buffer) {
            setLoadingAudioSegments(prev => new Set(prev).add(index));
            try {
                const audioCtx = getAudioContext();
                buffer = await fetchAudioData(storyResult!.segments[index].chinese, audioCtx);
                setAudioBuffers(prev => new Map(prev).set(index, buffer!));
            } catch (e) {
                 console.error(`Failed to fetch audio for segment ${index} during play-all`, e);
                 if (isPlayingAllRef.current) playSegmentsSequentially(index + 1);
                 return;
            } finally {
                 setLoadingAudioSegments(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });
            }
        }
        
        if (buffer) {
            setCurrentlyPlayingSegment(index);
            const audioCtx = getAudioContext();
            const source = playAudioBuffer(buffer, audioCtx);
            source.onended = () => {
                if (isPlayingAllRef.current) {
                   playSegmentsSequentially(index + 1);
                }
            };
            sourceNodeRef.current = source;
        } else {
            if(isPlayingAllRef.current) {
                playSegmentsSequentially(index + 1);
            }
        }
    }, [audioBuffers, storyResult]);

    const handleTogglePlayAll = () => {
        if (isPlayingAll) {
            setIsPlayingAll(false);
            setCurrentlyPlayingSegment(null);
            if (sourceNodeRef.current) {
                sourceNodeRef.current.stop();
                sourceNodeRef.current = null;
            }
        } else {
            setIsPlayingAll(true);
            playSegmentsSequentially(0);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Tạo Truyện Ngắn Song Ngữ</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Nhập chủ đề để AI tạo ra một câu chuyện ngắn kèm từ vựng và âm thanh.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        placeholder="Chủ đề, ví dụ: Một ngày ở Bắc Kinh"
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cấp độ từ vựng</label>
                        <select value={vocabLevel} onChange={e => setVocabLevel(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                            <option value="tocfl1">TOCFL 1+</option>
                            <option value="tocfl2">TOCFL 2+</option>
                            <option value="tocfl3">TOCFL 3+</option>
                            <option value="tocfl4">TOCFL 4+</option>
                            <option value="tocfl5">TOCFL 5+</option>
                            <option value="tocfl6">TOCFL 6</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading ? <LoadingSpinner /> : <BookOpenIcon className="w-5 h-5" />}
                    {isLoading ? 'Đang viết truyện...' : 'Tạo truyện'}
                </button>
            </div>

            {storyResult && (
                <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 animate-fade-in">
                    <h3 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">{storyResult.title}</h3>
                    <div className="text-center mb-6">
                         <button 
                            onClick={handleTogglePlayAll}
                            disabled={isLoading}
                            className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        >
                            {isPlayingAll ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5" />}
                            {isPlayingAll ? 'Dừng' : 'Phát toàn bộ truyện'}
                         </button>
                    </div>

                    <div className="space-y-6">
                        {storyResult.segments.map((segment, index) => (
                             <StorySegmentItem
                                key={index}
                                segment={segment}
                                index={index}
                                onVisible={() => preloadAudioForSegment(segment, index)}
                                onPlay={() => handlePlaySingleSegment(index)}
                                isPlaying={currentlyPlayingSegment === index}
                                isAudioReady={audioBuffers.has(index)}
                                isLoadingAudio={loadingAudioSegments.has(index)}
                             />
                        ))}
                    </div>
                </div>
            )}

            {storyResult && storyResult.vocabulary.length > 0 && (
                <VocabularyView 
                    externalVocab={storyResult.vocabulary}
                    savedList={savedList}
                    onToggleSave={onToggleSave}
                    addToast={addToast}
                    title="Từ vựng từ câu chuyện"
                />
            )}
        </div>
    );
};

export default StoryGeneratorView;
