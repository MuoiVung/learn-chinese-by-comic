import React, { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import type { VocabularyItem, Exercise, PracticeQuestion } from '../types';
import { generatePracticeExercises, speakText } from '../services/chineseToolsService';
import { SparklesIcon, BookmarkIcon, SpeakerIcon } from './Icons';

interface PracticeViewProps {
  practiceList: VocabularyItem[];
  onToggleSave: (item: VocabularyItem) => void;
  addToast: (message: string, type?: 'info' | 'error') => void;
}

const LoadingSpinner: FC<{ className?: string }> = ({ className = "h-5 w-5 text-white" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// A self-contained audio button for the feedback section
const AudioButton: FC<{ textToSpeak: string; addToast: PracticeViewProps['addToast'] }> = ({ textToSpeak, addToast }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handlePlay = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await speakText(textToSpeak);
        } catch (error) {
            console.error(`Failed to play audio for "${textToSpeak}"`, error);
            addToast(`Không thể phát âm thanh.`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handlePlay}
            disabled={isLoading}
            className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
        >
            {isLoading ? <LoadingSpinner className="w-4 h-4 text-slate-500" /> : <SpeakerIcon className="w-4 h-4" />}
        </button>
    );
};


const PracticeView: FC<PracticeViewProps> = ({ practiceList, onToggleSave, addToast }) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [listeningAnswer, setListeningAnswer] = useState('');


  const handleStartPractice = async () => {
    if (practiceList.length < 4) {
      addToast('Cần ít nhất 4 từ trong danh sách để tạo bài tập đa dạng.', 'error');
      return;
    }
    setIsLoading(true);
    setExercise(null);
    try {
      const generatedExercise = await generatePracticeExercises(practiceList);
      generatedExercise.questions.sort(() => Math.random() - 0.5);
      setExercise(generatedExercise);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setListeningAnswer('');
    } catch (error: any) {
      addToast(error.message || 'Không thể tạo bài tập.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    
    const question = exercise?.questions[currentQuestionIndex];
    if (!question) return;

    setSelectedAnswer(index);
    setIsAnswered(true);

    let isCorrect = false;
    if (question.type === 'listening') {
        isCorrect = listeningAnswer.trim().toLowerCase() === question.word.toLowerCase();
    } else {
        isCorrect = index === question.correctAnswerIndex;
    }

    if (isCorrect) {
        setScore(s => s + 1);
    }
  };
  
  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedAnswer(null);
    setListeningAnswer('');
    setCurrentQuestionIndex(i => i + 1);
  };
  
  const handleReset = () => {
      setExercise(null);
  };

  const renderPracticeSession = () => {
    if (!exercise || currentQuestionIndex >= exercise.questions.length) {
        return (
            <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md animate-fade-in">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Hoàn thành!</h3>
                <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
                    Điểm của bạn: <span className="font-bold text-2xl">{score} / {exercise?.questions.length}</span>
                </p>
                <div className="mt-6 flex gap-4 justify-center">
                    <button onClick={handleStartPractice} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                        Làm lại
                    </button>
                    <button onClick={handleReset} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                        Về danh sách
                    </button>
                </div>
            </div>
        );
    }
    
    const question = exercise.questions[currentQuestionIndex];

    const getButtonClass = (index: number) => {
        let buttonClass = 'p-4 w-full text-left rounded-lg border-2 transition-all duration-300 font-medium text-lg ';
        if (isAnswered) {
            const isCorrect = index === question.correctAnswerIndex;
            if (isCorrect) {
                buttonClass += 'bg-green-100 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200 scale-105';
            } else if (selectedAnswer === index) {
                buttonClass += 'bg-red-100 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-200';
            } else {
                buttonClass += 'bg-slate-100 dark:bg-slate-700 border-transparent opacity-60';
            }
        } else {
            buttonClass += 'bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600';
        }
        return buttonClass;
    }

    const QuestionContent = ({ q }: { q: PracticeQuestion }) => {
        const [isAudioLoading, setIsAudioLoading] = useState(false);

        const playQuestionAudio = useCallback(async () => {
            if (isAudioLoading) return;
            setIsAudioLoading(true);
            try {
                await speakText(q.word);
            } catch (e) {
                addToast("Không thể phát âm thanh.", 'error')
            } finally {
                setIsAudioLoading(false);
            }
        }, [isAudioLoading, q.word]);

        // Auto-play audio for listening questions
        useEffect(() => {
            if (q.type === 'listening') {
                // Use a short delay to ensure the UI has rendered and the user is ready.
                const timer = setTimeout(() => playQuestionAudio(), 300);
                return () => clearTimeout(timer);
            }
        }, [q.word, q.type, playQuestionAudio]);

        switch (q.type) {
            case 'listening':
                return (
                    <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-300 mb-4">{q.questionText}</p>
                        <button onClick={playQuestionAudio} disabled={isAudioLoading} className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition">
                            {isAudioLoading ? <LoadingSpinner className="w-8 h-8 text-blue-600 dark:text-blue-300"/> : <SpeakerIcon className="w-8 h-8" />}
                        </button>
                        <input
                            type="text"
                            value={listeningAnswer}
                            onChange={(e) => setListeningAnswer(e.target.value)}
                            disabled={isAnswered}
                            className="block w-full max-w-sm mx-auto text-center px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            placeholder="Gõ từ bạn nghe được..."
                        />
                    </div>
                );
            case 'fill-in-the-blank': {
                const currentItem = practiceList.find(item => item.word === q.word);
                return (
                     <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-300 mb-2">Hoàn thành câu sau:</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                            {q.questionText.split('___')[0]}
                            <span className="inline-block bg-slate-200 dark:bg-slate-700 rounded-md px-4 py-1 text-transparent mx-2">____</span>
                            {q.questionText.split('___')[1]}
                        </h3>
                        {isAnswered && currentItem && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-2 animate-fade-in">
                                "{currentItem.exampleTranslation}"
                            </p>
                        )}
                    </div>
                );
            }
            default: // multiple-choice
                return (
                    <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-300 mb-2">Nghĩa của từ sau là gì?</p>
                        <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-100">{question.word}</h3>
                    </div>
                );
        }
    };


    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-md animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Câu {currentQuestionIndex + 1} / {exercise.questions.length}
                </p>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Điểm: {score}
                </p>
            </div>
            
            <QuestionContent q={question} />

            <div className={`mt-8 grid grid-cols-1 ${question.type !== 'listening' ? 'md:grid-cols-2' : ''} gap-4`}>
                {question.type !== 'listening' ? (
                    question.options.map((option, index) => (
                        <button key={index} onClick={() => handleAnswerSelect(index)} disabled={isAnswered} className={getButtonClass(index)}>
                            {option}
                        </button>
                    ))
                ) : (
                    !isAnswered && (
                         <button onClick={() => handleAnswerSelect(0)} className="w-full max-w-xs mx-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                            Kiểm tra
                        </button>
                    )
                )}
            </div>

            {isAnswered && (
                 <div className="mt-8 text-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
                    {(() => {
                        const currentItem = practiceList.find(item => item.word === question.word);
                        let isCorrect = false;
                        if (question.type === 'listening') {
                            isCorrect = listeningAnswer.trim().toLowerCase() === question.word.toLowerCase();
                        } else {
                            isCorrect = selectedAnswer === question.correctAnswerIndex;
                        }

                        return (
                            <>
                                <p className={`text-xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                    {isCorrect ? 'Chính xác!' : 'Chưa đúng!'}
                                </p>
                                {currentItem && (
                                    <div className="mt-2 text-left space-y-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                                                    {currentItem.word}
                                                    <span className="font-mono text-blue-500 dark:text-blue-400 ml-3">{currentItem.pinyin}</span>
                                                </p>
                                                <AudioButton textToSpeak={currentItem.word} addToast={addToast} />
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300">{currentItem.vietnameseMeaning}</p>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="font-semibold text-slate-500 dark:text-slate-400">Ví dụ:</p>
                                            <div className="flex items-center gap-2">
                                               <p className="text-slate-700 dark:text-slate-200 flex-grow">{currentItem.exampleSentence}</p>
                                               <AudioButton textToSpeak={currentItem.exampleSentence} addToast={addToast} />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 italic">{currentItem.exampleTranslation}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}

                    <div className="mt-4 text-right">
                        <button onClick={handleNextQuestion} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                            Tiếp theo &rarr;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
  };
  
  const renderWordList = () => (
      <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
            <SparklesIcon className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-4">Danh sách luyện tập</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
                {practiceList.length > 0
                    ? `Bạn có ${practiceList.length} từ đã lưu. Nhấn nút bên dưới để bắt đầu bài kiểm tra.`
                    : 'Lưu các từ bạn muốn học từ tab "Tạo Từ Vựng" để bắt đầu luyện tập.'
                }
            </p>
            {practiceList.length > 0 && (
                <button
                    onClick={handleStartPractice}
                    disabled={isLoading}
                    className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all disabled:bg-slate-400 disabled:cursor-wait"
                >
                {isLoading ? (
                    <>
                    <LoadingSpinner />
                    Đang tạo bài tập...
                    </>
                ) : 'Bắt đầu luyện tập'}
                </button>
            )}
        </div>

        {practiceList.length > 0 && (
             <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-300">
                    Các từ đã lưu
                </h3>
                <ul className="space-y-3">
                    {practiceList.map(item => (
                        <li key={item.word} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 flex justify-between items-center animate-fade-in">
                            <div>
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.word} <span className="text-base font-normal text-blue-500 dark:text-blue-400 ml-2 font-mono">{item.pinyin}</span></p>
                                <p className="text-slate-600 dark:text-slate-400">{item.vietnameseMeaning}</p>
                            </div>
                             <button
                                onClick={() => onToggleSave(item)}
                                className="p-2 text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                title="Bỏ lưu"
                            >
                                <BookmarkIcon className="w-5 h-5" solid={true} />
                            </button>
                        </li>
                    ))}
                </ul>
             </div>
        )}
      </div>
  );

  return exercise ? renderPracticeSession() : renderWordList();
};

export default PracticeView;