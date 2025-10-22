import React, { useState } from 'react';
import type { VocabularyItem, ToastMessage } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import VocabularyView from './components/VocabularyView';
import PracticeView from './components/PracticeView';
import StoryGeneratorView from './components/StoryGeneratorView';
import ReadingComprehensionView from './components/ReadingComprehensionView'; // Import the new view
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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'Tạo Từ Vựng':
        return <VocabularyView savedList={savedList} onToggleSave={handleToggleSave} addToast={addToast} />;
      case 'Luyện Tập':
        return <PracticeView practiceList={savedList} onToggleSave={handleToggleSave} addToast={addToast} />;
      case 'Tạo Truyện':
        return <StoryGeneratorView savedList={savedList} onToggleSave={handleToggleSave} addToast={addToast} />;
      case 'Luyện Đọc Hiểu': // Add case for the new view
        return <ReadingComprehensionView addToast={addToast} />;
      default:
        return <VocabularyView savedList={savedList} onToggleSave={handleToggleSave} addToast={addToast} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="container mx-auto p-4 md:p-6">
        {renderCurrentView()}
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
