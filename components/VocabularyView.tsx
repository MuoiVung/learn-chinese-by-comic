import React from 'react';
import type { FC } from 'react';
import type { VocabularyItem } from '../types';
import { SpeakerIcon, GlobeIcon } from './Icons';
import { speakText } from '../services/chineseToolsService';

interface VocabularyViewProps {
  vocabulary: VocabularyItem[];
  isSpeechReady: boolean;
}

const VocabularyView: FC<VocabularyViewProps> = ({ vocabulary, isSpeechReady }) => {

  const handleLookup = (word: string) => {
    const url = `https://hanzii.net/search/word/${encodeURIComponent(word)}?hl=vi`;
    window.open(url, '_blank');
  };

  if (vocabulary.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold">Danh sách từ vựng trống</h2>
        <p className="text-slate-500">Hãy qua tab "Đọc truyện" và tải ảnh lên để tạo danh sách từ vựng.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-center">Danh sách từ vựng ({vocabulary.length} từ)</h2>
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {vocabulary.map((item, index) => (
            <li key={`${item.word}-${index}`} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div>
                <p className="text-sm text-blue-500 dark:text-blue-300 font-mono">{item.pinyin}</p>
                <p className="text-xl font-semibold">{item.word}</p>
              </div>
              <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
                <button 
                  onClick={() => speakText(item.word)} 
                  className="p-2 hover:text-blue-500 transition-colors rounded-full disabled:opacity-50 disabled:cursor-not-allowed" 
                  title={isSpeechReady ? "Phát âm" : "Tính năng phát âm chưa sẵn sàng. Vui lòng cấu hình API Key."}
                  disabled={!isSpeechReady}
                >
                  <SpeakerIcon className="w-5 h-5" />
                </button>
                <button onClick={() => handleLookup(item.word)} className="p-2 hover:text-green-500 transition-colors rounded-full" title="Tra từ trên Hanzii">
                  <GlobeIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VocabularyView;