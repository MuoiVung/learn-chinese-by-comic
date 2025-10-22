import React, { useState, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { generateReadingComprehension, fetchAudioData, getAudioContext, playAudioBuffer } from '../services/chineseToolsService';
import type { ReadingComprehensionExercise, ReadingComprehensionQuestion } from '../types';
import { AcademicCapIcon, PlayIcon, StopIcon } from './Icons';
import { LoadingSpinner, AudioButton } from './Shared';

interface QuestionItemProps {
    question: ReadingComprehensionQuestion;
    index: number;
    userAnswer: number | null;
    onAnswer: (questionIndex: number, optionIndex: number) => void;
    addToast: (msg: string, type?: 'info' | 'error') => void;
    audioBuffers: Map<string, AudioBuffer>;
    loadingAudio: Set<string>;
}

const QuestionItem: FC<QuestionItemProps> = ({ question, index, userAnswer, onAnswer, addToast, audioBuffers, loadingAudio }) => {
    const isAnswered = userAnswer !== null;

    const getButtonClass = (optionIndex: number) => {
        let baseClass = 'p-4 w-full rounded-lg border-2 transition-all duration-300 font-medium text-lg ';
        if (isAnswered) {
            const isCorrect = optionIndex === question.correctAnswerIndex;
            if (isCorrect) {
                return baseClass + 'bg-green-100 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200 scale-105';
            }
            if (userAnswer === optionIndex) {
                return baseClass + 'bg-red-100 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-200';
            }
            return baseClass + 'bg-slate-100 dark:bg-slate-700 border-transparent opacity-60';
        }
        return baseClass + 'bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600';
    };

    return (
        <li className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md animate-fade-in">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-grow">
                    <h4 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        Câu {index + 1}: {question.questionText}
                    </h4>
                    {isAnswered && (
                        <>
                            <p className="font-mono text-blue-500 dark:text-blue-400 mt-1 animate-fade-in">{question.questionPinyin}</p>
                            <p className="text-slate-600 dark:text-slate-400 italic mt-1 animate-fade-in">{question.questionTranslation}</p>
                        </>
                    )}
                </div>
                <AudioButton
                    textToSpeak={question.questionText}
                    addToast={addToast}
                    preloadedBuffer={audioBuffers.get(question.questionText)}
                    isPreloading={loadingAudio.has(question.questionText)}
                    iconClassName="w-6 h-6"
                />
            </div>

            <div className="mt-4 space-y-3">
                {question.options.map((opt, optIndex) => (
                    <button
                        key={optIndex}
                        onClick={() => onAnswer(index, optIndex)}
                        disabled={isAnswered}
                        className={getButtonClass(optIndex)}
                    >
                        <div className="flex justify-between items-center w-full">
                            <div className="text-left">
                                <span className="font-semibold">{String.fromCharCode(65 + optIndex)}. {opt.optionText}</span>
                                {isAnswered && (
                                    <>
                                        <p className="font-mono text-blue-500 dark:text-blue-400 text-sm mt-1 animate-fade-in">{opt.pinyin}</p>
                                        <p className="text-slate-600 dark:text-slate-400 italic text-sm mt-1 animate-fade-in">{opt.optionTranslation}</p>
                                    </>
                                )}
                            </div>
                            <AudioButton
                                textToSpeak={opt.optionText}
                                addToast={addToast}
                                preloadedBuffer={audioBuffers.get(opt.optionText)}
                                isPreloading={loadingAudio.has(opt.optionText)}
                            />
                        </div>
                    </button>
                ))}
            </div>

            {isAnswered && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <p className="font-bold text-slate-700 dark:text-slate-200">Giải thích:</p>
                    <p className="text-slate-600 dark:text-slate-300">{question.explanation}</p>
                </div>
            )}
        </li>
    );
};

const ReadingComprehensionView: FC<{ addToast: (msg: string, type?: 'info' | 'error') => void }> = ({ addToast }) => {
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [exercise, setExercise] = useState<ReadingComprehensionExercise | null>(null);
    const [mainAudioBuffer, setMainAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

    const [qaAudioBuffers, setQaAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
    const [loadingQaAudio, setLoadingQaAudio] = useState<Set<string>>(new Set());

    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const preloadAllQuestionAudio = useCallback(async (exerciseToPreload: ReadingComprehensionExercise) => {
        if (!exerciseToPreload) return;

        const textsToLoad = new Set<string>();
        exerciseToPreload.questions.forEach(q => {
            textsToLoad.add(q.questionText);
            q.options.forEach(opt => textsToLoad.add(opt.optionText));
        });

        const uniqueTexts = Array.from(textsToLoad).filter(text =>
            text && !qaAudioBuffers.has(text) && !loadingQaAudio.has(text)
        );

        if (uniqueTexts.length === 0) return;

        setLoadingQaAudio(prev => new Set([...prev, ...uniqueTexts]));

        try {
            const audioCtx = getAudioContext();
            const promises = uniqueTexts.map(text => fetchAudioData(text, audioCtx).catch(e => {
                console.error(`Failed to preload audio for: ${text}`, e);
                return null;
            }));
            const results = await Promise.all(promises);

            setQaAudioBuffers(prev => {
                const newMap = new Map(prev);
                uniqueTexts.forEach((text, i) => {
                    if (results[i]) newMap.set(text, results[i] as AudioBuffer);
                });
                return newMap;
            });
        } catch (e) {
            console.error("Failed to preload question/answer audio", e);
        } finally {
            setLoadingQaAudio(prev => {
                const newSet = new Set(prev);
                uniqueTexts.forEach(text => newSet.delete(text));
                return newSet;
            });
        }
    }, [qaAudioBuffers, loadingQaAudio]);

    const handleGenerate = async () => {
        if (!inputText.trim()) {
            addToast('Vui lòng nhập văn bản tiếng Trung.', 'info');
            return;
        }
        setIsLoading(true);
        setIsAudioLoading(true);
        setExercise(null);
        setMainAudioBuffer(null);
        setQaAudioBuffers(new Map());
        setLoadingQaAudio(new Set());
        setUserAnswers([]);

        try {
            // Fetch exercise and audio in parallel
            const exercisePromise = generateReadingComprehension(inputText);
            const audioCtx = getAudioContext();
            const audioPromise = fetchAudioData(inputText, audioCtx);

            const [exerciseResult, audioResult] = await Promise.all([
                exercisePromise,
                audioPromise
            ]);

            setExercise(exerciseResult);
            setUserAnswers(new Array(exerciseResult.questions.length).fill(null));
            setMainAudioBuffer(audioResult);
            preloadAllQuestionAudio(exerciseResult);

        } catch (error: any) {
            addToast(error.message || 'Không thể tạo bài tập.', 'error');
        } finally {
            setIsLoading(false);
            setIsAudioLoading(false);
        }
    };
    
    const handleTogglePlay = () => {
        if (isPlaying) {
            sourceNodeRef.current?.stop();
            setIsPlaying(false);
        } else if (mainAudioBuffer) {
            const audioCtx = getAudioContext();
            const source = playAudioBuffer(mainAudioBuffer, audioCtx);
            source.onended = () => setIsPlaying(false);
            sourceNodeRef.current = source;
            setIsPlaying(true);
        }
    };
    
    const handleAnswer = (questionIndex: number, optionIndex: number) => {
        setUserAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[questionIndex] = optionIndex;
            return newAnswers;
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Luyện Đọc Hiểu</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Dán một đoạn văn bản tiếng Trung (phồn thể) vào đây để tạo bài tập đọc hiểu và nghe.
                </p>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="mt-4 w-full h-40 p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-sans"
                    placeholder="請在此處貼上繁體中文文字..."
                />
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
                            <AcademicCapIcon className="w-5 h-5" />
                            Tạo bài tập
                        </>
                    )}
                </button>
            </div>

            {exercise && (
                 <div className="mt-8">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-300">
                            Nội dung bài đọc
                        </h3>
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={handleTogglePlay}
                                disabled={isAudioLoading || !mainAudioBuffer}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                            >
                                {isAudioLoading ? (
                                    <>
                                        <LoadingSpinner className="w-5 h-5 text-slate-500" /> Đang tải âm thanh...
                                    </>
                                ) : (
                                    <>
                                        {isPlaying ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                        {isPlaying ? 'Dừng' : 'Nghe'}
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                            {inputText}
                        </p>
                    </div>

                    <h3 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-300">
                        Câu hỏi
                    </h3>
                    <ul className="space-y-4">
                        {exercise.questions.map((q, i) => (
                           <QuestionItem
                                key={i}
                                question={q}
                                index={i}
                                userAnswer={userAnswers[i]}
                                onAnswer={handleAnswer}
                                addToast={addToast}
                                audioBuffers={qaAudioBuffers}
                                loadingAudio={loadingQaAudio}
                           />
                        ))}
                    </ul>
                 </div>
            )}
        </div>
    );
};

export default ReadingComprehensionView;