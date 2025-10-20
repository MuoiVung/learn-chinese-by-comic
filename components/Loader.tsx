
import React from 'react';

interface LoaderProps {
  progress: number;
}

const Loader: React.FC<LoaderProps> = ({ progress }) => {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress * 100)));
  
  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white rounded-lg">
      <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg font-semibold">Đang nhận diện chữ...</p>
      <p className="text-sm">{clampedProgress}%</p>
      <div className="w-4/5 bg-gray-600 rounded-full h-2.5 mt-2">
        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${clampedProgress}%` }}></div>
      </div>
    </div>
  );
};

export default Loader;
