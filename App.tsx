import React, { useState, useCallback } from 'react';
import type { FC } from 'react';
import Header from './components/Header';
import VocabularyView from './components/VocabularyView';
import { ToastContainer } from './components/Toast';
import type { VocabularyItem, ToastMessage } from './types';
import { segmentWords, getPinyin, generateVocabularyDetails } from './services/chineseToolsService';
import { BeakerIcon } from './components/Icons';

const App: FC = () => {
  const [inputText, setInputText] = useState('');
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [level, setLevel] = useState('all'); // 'all', 'suggested', 'tocfl1', etc.

  const addToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev.filter(t => t.message !== message), { id, message, type }]);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleGenerate = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText) {
      addToast('Vui lòng nhập vào một đoạn văn bản tiếng Trung.', 'error');
      return;
    }

    setIsLoading(true);
    setVocabulary([]); // Clear previous results

    try {
      let detailsFromAI;

      if (level === 'suggested') {
        // For 'suggested', send the whole text and let the AI find the words.
        detailsFromAI = await generateVocabularyDetails([], 'suggested', trimmedText);
      } else {
        // For 'all' and 'tocfl' levels, segment the words first.
        const words = segmentWords(trimmedText);
        const uniqueWords = [...new Set(words)]
          .filter(word => word.trim().length > 0 && /[\u4e00-\u9fa5]/.test(word));

        if (uniqueWords.length === 0) {
          addToast('Không tìm thấy từ tiếng Trung nào trong văn bản.', 'info');
          setIsLoading(false);
          return;
        }
        
        detailsFromAI = await generateVocabularyDetails(uniqueWords, level);
      }
      
      if (!detailsFromAI || detailsFromAI.length === 0) {
          let message = 'Không tìm thấy từ vựng phù hợp với lựa chọn của bạn.';
          if (level !== 'all' && level !== 'suggested') {
              message = `Không tìm thấy từ vựng nào thuộc cấp độ ${level.toUpperCase()} trong văn bản.`
          }
          addToast(message, 'info');
          setVocabulary([]);
          return;
      }

      // 3. Combine and add Pinyin
      const vocabItems: VocabularyItem[] = detailsFromAI.map((item: any) => ({
        ...item,
        pinyin: getPinyin(item.word),
        examplePinyin: getPinyin(item.exampleSentence),
      })).sort((a,b) => a.word.localeCompare(b.word, 'zh-Hans-CN'));
      
      setVocabulary(vocabItems);
      addToast(`Đã tạo thành công ${vocabItems.length} mục từ vựng.`, 'info');

    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Đã xảy ra lỗi không xác định.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Nhập đoạn văn tiếng Trung</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 mb-4">
            Dán một đoạn văn vào đây, ứng dụng sẽ tự động tách từ, tạo danh sách từ vựng kèm theo nghĩa, ví dụ và phát âm.
          </p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-base shadow-sm placeholder-slate-400
              focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              transition"
            placeholder="Ví dụ: 我今天很高兴，因为我学到了很多新东西。"
            disabled={isLoading}
          />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="level-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cấp độ từ vựng
              </label>
              <select
                id="level-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={isLoading}
                className="block w-full px-3 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              >
                <option value="all">Tất cả các từ</option>
                <option value="suggested">Gợi ý từ khó/quan trọng</option>
                <option value="tocfl1">TOCFL 1</option>
                <option value="tocfl2">TOCFL 2</option>
                <option value="tocfl3">TOCFL 3</option>
                <option value="tocfl4">TOCFL 4</option>
                <option value="tocfl5">TOCFL 5</option>
                <option value="tocfl6">TOCFL 6</option>
              </select>
            </div>
            <div className="flex justify-end">
                <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all
                    disabled:bg-slate-400 disabled:cursor-wait"
                >
                {isLoading ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                    </>
                ) : (
                    <>
                    <BeakerIcon className="w-5 h-5" />
                    Tạo từ vựng
                    </>
                )}
                </button>
            </div>
          </div>
        </div>
        
        <VocabularyView vocabulary={vocabulary} addToast={addToast} />

      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;