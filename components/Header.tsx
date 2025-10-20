import React from 'react';
import type { FC } from 'react';
import { BookOpenIcon, PencilSquareIcon, BeakerIcon } from './Icons';

type Tab = 'comics' | 'vocabulary' | 'tts-test';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  hasVocabulary: boolean;
}

const Header: FC<HeaderProps> = ({ activeTab, onTabChange, hasVocabulary }) => {
  const getButtonClasses = (tab: Tab) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500";
    if (activeTab === tab) {
      return `${base} bg-blue-600 text-white`;
    }
    return `${base} bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600`;
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md p-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
          Học tiếng Trung qua Truyện tranh
        </h1>
        <nav className="flex items-center gap-2 md:gap-4">
            <button className={getButtonClasses('comics')} onClick={() => onTabChange('comics')}>
              <BookOpenIcon className="w-5 h-5"/>
              <span className="hidden md:inline">📖 Đọc truyện</span>
            </button>
            {hasVocabulary && (
              <button className={getButtonClasses('vocabulary')} onClick={() => onTabChange('vocabulary')}>
                <PencilSquareIcon className="w-5 h-5"/>
                <span className="hidden md:inline">📝 Từ vựng</span>
              </button>
            )}
            <button className={getButtonClasses('tts-test')} onClick={() => onTabChange('tts-test')}>
              <BeakerIcon className="w-5 h-5"/>
              <span className="hidden md:inline">Kiểm tra TTS</span>
            </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;