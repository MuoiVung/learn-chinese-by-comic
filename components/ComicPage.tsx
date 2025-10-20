import React from 'react';
import type { FC } from 'react';
import type { ComicPage as ComicPageType } from '../types';
import Loader from './Loader';
import { SpeakerIcon, GlobeIcon } from './Icons';
import { speakText } from '../services/chineseToolsService';

interface ComicPageProps {
  page: ComicPageType;
  pageNumber: number;
  isSpeechReady: boolean;
}

const ComicPage: FC<ComicPageProps> = ({ page, pageNumber, isSpeechReady }) => {

  const handleTranslate = (text: string) => {
    const url = `https://translate.google.com/?sl=zh-CN&tl=vi&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      <h2 className="text-xl font-bold p-4 bg-slate-50 dark:bg-slate-700">Trang {pageNumber}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Image Column */}
        <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <img src={page.url} alt={`Comic page ${pageNumber}`} className="w-full h-auto object-contain" />
          {page.status === 'processing' && <Loader progress={page.progress} />}
          {page.status === 'error' && (
            <div className="absolute inset-0 bg-red-800 bg-opacity-80 flex items-center justify-center text-white">
              <p>Lỗi nhận diện chữ.</p>
            </div>
          )}
        </div>
        
        {/* OCR Result Column */}
        <div className="flex flex-col space-y-3">
          {page.status === 'pending' && <p className="text-slate-500">Đang chờ xử lý...</p>}
          {page.sentences.length > 0 ? (
            page.sentences.map(sentence => (
              <div key={sentence.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                <p className="text-sm text-blue-500 dark:text-blue-300 font-mono mb-1">{sentence.pinyin}</p>
                <div className="flex justify-between items-center">
                    <p className="text-lg font-medium">{sentence.text}</p>
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                    <button 
                        onClick={() => speakText(sentence.text)} 
                        className="p-1 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        title={isSpeechReady ? "Phát âm" : "Tính năng phát âm chưa sẵn sàng. Vui lòng cấu hình API Key."}
                        disabled={!isSpeechReady}
                    >
                        <SpeakerIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleTranslate(sentence.text)} className="p-1 hover:text-green-500 transition-colors" title="Dịch với Google">
                        <GlobeIcon className="w-5 h-5"/>
                    </button>
                    </div>
                </div>
              </div>
            ))
          ) : (
            page.status === 'done' && <p className="text-slate-500">Không tìm thấy chữ nào trên ảnh này.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComicPage;