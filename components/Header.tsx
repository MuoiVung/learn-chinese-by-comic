import React from 'react';
import type { FC } from 'react';

// FIX: Provide the Header component for app navigation and title.

interface HeaderProps {
    currentView: string;
    setCurrentView: (view: string) => void;
}

const Header: FC<HeaderProps> = ({ currentView, setCurrentView }) => {
    const navItems = ['Tạo Từ Vựng', 'Luyện Tập', 'Tạo Truyện', 'Luyện Đọc Hiểu'];
    
    return (
        <header className="bg-white dark:bg-slate-900 shadow-md">
            <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    Hán Ngữ AI
                </h1>
                <nav className="mt-4 sm:mt-0">
                    <ul className="flex space-x-2 md:space-x-4">
                        {navItems.map(item => {
                             const isActive = currentView === item;
                             return (
                                <li key={item}>
                                    <button 
                                        onClick={() => setCurrentView(item)}
                                        className={`px-4 py-2 text-sm md:text-base font-semibold rounded-md transition-colors duration-300 ${
                                            isActive 
                                                ? 'bg-blue-600 text-white' 
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                </li>
                             );
                        })}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;