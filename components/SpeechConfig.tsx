import React from 'react';

// Fix: This component has been updated to align with the Gemini API guidelines,
// which prohibit UI elements for managing API keys. The API key is expected
// to be provided via the `process.env.API_KEY` environment variable.
// Unused props are kept for compatibility with parent components that are not being modified.
interface SpeechConfigProps {
  apiKey: string;
  onApiKeySave: (key: string) => void;
  isSpeechReady: boolean;
}

const SpeechConfig: React.FC<SpeechConfigProps> = ({ isSpeechReady }) => {
  if (isSpeechReady) {
    return (
      <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-800 dark:text-green-200 p-4 rounded-r-lg mb-6 flex justify-between items-center">
        <div>
            <p className="font-bold">
                Tính năng phát âm đã được kích hoạt.
            </p>
            <p className="text-sm opacity-80">Tính năng phát âm (TTS) được cung cấp bởi Google Gemini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg mb-6" role="alert">
      <p className="font-bold">Cấu hình tính năng phát âm (TTS)</p>
      <p className="text-sm mb-2">
        Để sử dụng tính năng phát âm, API key của Google Gemini cần được cấu hình trong biến môi trường.
      </p>
    </div>
  );
};

export default SpeechConfig;
