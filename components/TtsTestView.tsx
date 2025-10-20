import React, { useState } from 'react';
import type { FC } from 'react';
import { SpeakerIcon } from './Icons';
import { speakText } from '../services/chineseToolsService';

interface TtsTestViewProps {
  isSpeechReady: boolean;
}

const TtsTestView: FC<TtsTestViewProps> = ({ isSpeechReady }) => {
  const [text, setText] = useState('你好世界');

  const handleSpeak = () => {
    if (text.trim()) {
      speakText(text.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Kiểm tra tính năng phát âm (Text-to-Speech)</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Nhập một vài từ hoặc một câu tiếng Trung vào ô bên dưới và nhấn nút phát âm để kiểm tra xem dịch vụ có hoạt động với API Key của bạn không.
        </p>

        {!isSpeechReady && (
          <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg mb-4">
            <p className="font-bold">Chức năng phát âm chưa sẵn sàng.</p>
            <p>Vui lòng cấu hình API Key ở phía trên để kích hoạt.</p>
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400
            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
            transition"
          placeholder="Nhập chữ Hán vào đây..."
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSpeak}
            disabled={!isSpeechReady || !text.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors
              disabled:bg-slate-400 disabled:cursor-not-allowed"
            title={isSpeechReady ? "Phát âm" : "Vui lòng cấu hình API Key để sử dụng tính năng này."}
          >
            <SpeakerIcon className="w-5 h-5" />
            Phát âm
          </button>
        </div>
      </div>
    </div>
  );
};

export default TtsTestView;
