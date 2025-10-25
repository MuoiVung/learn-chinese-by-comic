import React, { useState } from 'react';
import type { FC } from 'react';
import type { GrammarAnalysisResult, GrammarPoint, GrammarExplanation, GrammarExercise } from '../types';
import { analyzeGrammar } from '../services/chineseToolsService';
import { LoadingSpinner, AudioButton } from './Shared';
import { AcademicCapIcon, ChevronDownIcon, LightBulbIcon, BookOpenIcon, CheckIcon, XMarkIcon } from './Icons';

const ExerciseItem: FC<{ exercise: GrammarExercise, index: number }> = ({ exercise, index }) => {
    const [userAnswer, setUserAnswer] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleCheckAnswer = () => {
        const finalAnswer = exercise.type === 'sentence-ordering' ? userAnswer.join('') : userAnswer[0] || '';
        setIsCorrect(finalAnswer.trim() === exercise.correctAnswer.trim());
        setIsSubmitted(true);
    };

    const handleReset = () => {
        setUserAnswer([]);
        setIsSubmitted(false);
        setIsCorrect(false);
    };

    const handleSentenceOrderingClick = (option: string) => {
        setUserAnswer(prev => [...prev, option]);
    };
    
    const handleRemoveFromAnswer = (indexToRemove: number) => {
        setUserAnswer(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const renderFeedback = () => {
        if (!isSubmitted) return null;
        return (
            <div className={`mt-3 flex items-center gap-2 p-2 rounded-md text-sm font-semibold animate-fade-in ${isCorrect ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
                {isCorrect ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
                <span>{isCorrect ? 'Chính xác!' : `Sai rồi! Đáp án đúng là: "${exercise.correctAnswer}"`}</span>
            </div>
        );
    };

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h5 className="font-semibold text-slate-700 dark:text-slate-300">Bài {index + 1}: {exercise.questionText}</h5>
            
            {exercise.type === 'fill-in-the-blank' && (
                <div className="mt-2">
                     <input
                        type="text"
                        value={userAnswer[0] || ''}
                        onChange={(e) => setUserAnswer([e.target.value])}
                        disabled={isSubmitted}
                        className="w-full md:w-1/2 p-2 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:border-blue-500"
                        placeholder={exercise.options.join(' / ')}
                    />
                </div>
            )}

            {exercise.type === 'sentence-ordering' && (
                <div className="mt-2">
                    <div className="p-3 min-h-[50px] bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md flex flex-wrap gap-2 items-center">
                        {userAnswer.map((word, i) => (
                            <button key={i} onClick={() => handleRemoveFromAnswer(i)} className="px-2 py-1 bg-blue-500 text-white rounded-md animate-fade-in">
                                {word} <span className="ml-1 text-blue-200">x</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nhấp vào các từ dưới đây theo đúng thứ tự.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {exercise.options.map(opt => (
                            <button 
                                key={opt} 
                                onClick={() => handleSentenceOrderingClick(opt)}
                                disabled={isSubmitted}
                                className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {renderFeedback()}
            
            <div className="mt-4 text-right">
                {isSubmitted ? (
                    <button onClick={handleReset} className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-600 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition">Làm lại</button>
                ) : (
                    <button onClick={handleCheckAnswer} className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">Kiểm tra đáp án</button>
                )}
            </div>
        </div>
    );
};

const GrammarPointComponent: FC<{ point: GrammarPoint, isCollapsible?: boolean }> = ({ point, isCollapsible = false }) => {
    const [activeTab, setActiveTab] = useState<'explanation' | 'exercises'>('explanation');
    const [isCollapsed, setIsCollapsed] = useState(isCollapsible);

    const TabButton: FC<{ tabName: 'explanation' | 'exercises', children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === tabName ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        >
            {children}
        </button>
    );

    if (isCollapsible) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full flex justify-between items-center p-4 text-left">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Ngữ pháp liên quan: <span className="text-blue-600 dark:text-blue-400">{point.name}</span> (Tìm thấy trong câu ví dụ)
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>
                {!isCollapsed && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                        <GrammarPointComponent point={point} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                 <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{point.name}</h3>
                    <AudioButton textToSpeak={point.name} addToast={() => {}} />
                </div>
            </div>
            
            <div className="border-b border-slate-200 dark:border-slate-700 px-4 bg-slate-50 dark:bg-slate-900/50">
                <nav className="flex -mb-px">
                    <TabButton tabName="explanation"><LightBulbIcon className="w-5 h-5" /> Giải thích</TabButton>
                    <TabButton tabName="exercises"><BookOpenIcon className="w-5 h-5" /> Bài tập</TabButton>
                </nav>
            </div>
            
            <div className="p-4 md:p-6">
                {activeTab === 'explanation' ? (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <h4 className="font-bold text-slate-600 dark:text-slate-300">Ý nghĩa</h4>
                            <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{point.explanation.meaning}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-600 dark:text-slate-300">Cấu trúc</h4>
                            <p className="font-mono p-2 bg-slate-100 dark:bg-slate-700 rounded-md text-blue-600 dark:text-blue-400">{point.explanation.structure}</p>
                        </div>
                         <div>
                            <h4 className="font-bold text-slate-600 dark:text-slate-300">Ví dụ</h4>
                            <ul className="space-y-3 mt-2">
                                {point.explanation.examples.map((ex, i) => (
                                    <li key={i} className="p-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-900/50 rounded-r-md">
                                        <div className="flex items-start justify-between">
                                            <p className="text-lg text-slate-800 dark:text-slate-100 flex-grow">{ex.chinese}</p>
                                            <AudioButton textToSpeak={ex.chinese} addToast={() => {}} iconClassName="w-5 h-5" />
                                        </div>
                                        <p className="font-mono text-blue-500 dark:text-blue-400 text-sm">{ex.pinyin}</p>
                                        <p className="text-slate-600 dark:text-slate-400 italic text-sm mt-1">{ex.vietnamese}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        {point.exercises.map((ex, i) => (
                            <ExerciseItem key={i} exercise={ex} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


const GrammarView: FC<{ addToast: (msg: string, type?: 'info' | 'error') => void }> = ({ addToast }) => {
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<GrammarAnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!inputText.trim()) {
            addToast('Vui lòng nhập từ khóa, câu, hoặc đoạn văn bản.', 'info');
            return;
        }
        setIsLoading(true);
        setAnalysisResult(null);
        try {
            const result = await analyzeGrammar(inputText);
            setAnalysisResult(result);
        } catch (error: any) {
            addToast(error.message || 'Không thể phân tích ngữ pháp.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getResultTitle = () => {
        if (!analysisResult) return '';
        const mainCount = analysisResult.mainTopics.length;
        const secondaryCount = analysisResult.secondaryTopics.length;
        if (mainCount === 0) return 'Không tìm thấy điểm ngữ pháp nào.';

        let title = `Chúng tôi tìm thấy ${mainCount} điểm ngữ pháp chính.`;
        if (secondaryCount > 0) {
            title += ` (và ${secondaryCount} ngữ pháp liên quan).`
        }
        return title;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Học Ngữ Pháp Tiếng Trung</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Nhập một từ khóa, câu, hoặc dán một đoạn văn bản (phồn thể) để AI phân tích, giải thích và tạo bài tập.
                </p>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="mt-4 w-full h-40 p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-sans"
                    placeholder="Ví dụ: 昨天看的那個房子髒得要命，簡直不能住。"
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner />
                            Đang phân tích...
                        </>
                    ) : (
                        <>
                            <AcademicCapIcon className="w-5 h-5" />
                            Giải thích và tạo bài tập
                        </>
                    )}
                </button>
            </div>

            {isLoading && (
                <div className="text-center mt-8">
                    <LoadingSpinner className="h-8 w-8 text-blue-500 mx-auto" />
                    <p className="mt-2 text-slate-600 dark:text-slate-400">AI đang phân tích ngữ pháp... Quá trình này có thể mất một lát.</p>
                </div>
            )}

            {analysisResult && (
                 <div className="mt-8 space-y-6">
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 animate-fade-in">{getResultTitle()}</h3>
                    {analysisResult.mainTopics.map((point, i) => (
                        <div key={`main-${i}`} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms`}}>
                            <GrammarPointComponent point={point} />
                        </div>
                    ))}
                    {analysisResult.secondaryTopics.map((point, i) => (
                         <div key={`secondary-${i}`} className="animate-fade-in" style={{ animationDelay: `${(analysisResult.mainTopics.length + i) * 100}ms`}}>
                            <GrammarPointComponent point={point} isCollapsible={true} />
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
};

export default GrammarView;
