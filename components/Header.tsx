import React from 'react';
import type { FC } from 'react';
import { BookOpenIcon } from './Icons';

const Header: FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md p-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-center items-center">
        <div className="flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
            <h1 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                Tạo Từ Vựng Tiếng Trung
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;