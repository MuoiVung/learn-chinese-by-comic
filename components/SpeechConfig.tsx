import React, { useState } from 'react';

interface SpeechConfigProps {
  apiKey: string;
  onApiKeySave: (key: string) => void;
  isSpeechReady: boolean;
}

const SpeechConfig: React.FC<SpeechConfigProps> = ({ apiKey, onApiKeySave, isSpeechReady }) => {
  const [currentKey, setCurrentKey] = useState(apiKey);
  const [isEditing, setIsEditing] = useState(!apiKey);

  const handleSave = () => {
    onApiKeySave(currentKey.trim());
    setIsEditing(false);
  };

  const handleEdit = () => {
    setCurrentKey(apiKey); // Reset input to current saved key
    setIsEditing(true);
  }

  if (isEditing) {
    return (
      <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-r-lg mb-6" role="alert">
        <p className="font-bold">Cấu hình tính năng phát âm (TTS)</p>
        <p className="text-sm mb-2">
          Ứng dụng sử dụng ResponsiveVoice cho TTS. Bạn cần có API key (miễn phí cho mục đích cá nhân).
          <a href="https://responsivevoice.org/register/" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-blue-600">
             Nhận API Key tại đây.
          </a>
        </p>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            placeholder="Dán API Key của bạn vào đây"
            className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400
              focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
          >
            Lưu Key
          </button>
           {apiKey && (
            <button onClick={() => setIsEditing(false)} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:underline">
              Hủy
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-800 dark:text-green-200 p-4 rounded-r-lg mb-6 flex justify-between items-center">
        <div>
            <p className="font-bold">
                {isSpeechReady ? 'Tính năng phát âm đã được kích hoạt.' : 'Đang tải dịch vụ phát âm...'}
            </p>
            <p className="text-sm opacity-80">Tính năng phát âm (TTS) đã được cấu hình.</p>
        </div>
        <button onClick={handleEdit} className="text-sm font-semibold underline hover:text-green-600">
            Đổi API Key
        </button>
    </div>
  );
};

export default SpeechConfig;
