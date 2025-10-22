import React, { useState } from 'react';
import type { VocabularyItem, ToastMessage } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import VocabularyView from './components/VocabularyView';
import PracticeView from './components/PracticeView';
import StoryGeneratorView from './components/StoryGeneratorView';
import ReadingComprehensionView from './components/ReadingComprehensionView';
import { ToastContainer } from './components/Toast';

function App() {
  const [currentView, setCurrentView] = useState('Tạo Từ Vựng');
  const [savedList, setSavedList] = useLocalStorage<VocabularyItem[]>('han-ngu-ai-saved-list', []);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'info' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleToggleSave = (item: VocabularyItem) => {
    setSavedList(prevList => {
      const isSaved = prevList.some(i => i.word === item.word);
      if (isSaved) {
        addToast(`Đã bỏ lưu từ "${item.word}".`, 'info');
        return prevList.filter(i => i.word !== item.word);
      } else {
        addToast(`Đã lưu từ "${item.word}".`, 'info');
        return [...prevList, item];
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="container mx-auto p-4 md:p-6">
        <div hidden={currentView !== 'Tạo Từ Vựng'}>
          <VocabularyView savedList={savedList} onToggleSave={handleToggleSave} addToast={addToast} />
        </div>
        <div hidden={currentView !== 'Luyện Tập'}>
          <PracticeView practiceList={savedList} onToggleSave={handleToggleSave} addToast={addToast} />
        </div>
        <div hidden={currentView !== 'Tạo Truyện'}>
          <StoryGeneratorView savedList={savedList} onToggleSave={handleToggleSave} addToast={addToast} />
        </div>
        <div hidden={currentView !== 'Luyện Đọc Hiểu'}>
          <ReadingComprehensionView addToast={addToast} />
        </div>
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
