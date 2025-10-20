// Fix: Create the main App component to manage application state and fix module export error.
import React, { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent, FC } from 'react';
import Header from './components/Header';
import ComicsView from './components/ComicsView';
import VocabularyView from './components/VocabularyView';
import TtsTestView from './components/TtsTestView';
import SpeechConfig from './components/SpeechConfig';
import { ToastContainer } from './components/Toast';
import type { ComicPage, VocabularyItem, ToastMessage } from './types';
import { performOcr } from './services/ocrService';
import { segmentWords, getPinyin } from './services/chineseToolsService';

const App: FC = () => {
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [activeTab, setActiveTab] = useState<'comics' | 'vocabulary' | 'tts-test'>('comics');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('responsiveVoiceApiKey') || '');
  const [isSpeechReady, setIsSpeechReady] = useState(false);

  const addToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const id = Date.now();
    // Avoid duplicate toasts
    setToasts(prev => {
        if (prev.some(t => t.message === message)) return prev;
        return [...prev, { id, message, type }];
    });
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  // Speech Synthesis setup
  useEffect(() => {
    if (!apiKey) {
      setIsSpeechReady(false);
      return;
    }

    const scriptId = 'responsivevoice-script';
    // Clean up old script if any to ensure the new key is used
    const oldScript = document.getElementById(scriptId);
    if (oldScript) {
        oldScript.remove();
    }
    
    // Reset status on key change
    setIsSpeechReady(false);
    
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://code.responsivevoice.org/responsivevoice.js?key=${apiKey}`;
    script.async = true;
    
    const onScriptLoad = () => {
        window.responsiveVoice_onvoicesloaded = () => {
            setIsSpeechReady(true);
            addToast('Tính năng phát âm đã sẵn sàng.', 'info');
        };
        // Fallback for browsers/networks where the event might not fire reliably
        setTimeout(() => {
           if(window.responsiveVoice && window.responsiveVoice.getVoices().length > 0) {
              // React handles duplicate state sets.
              setIsSpeechReady(true);
           } else {
             addToast('Không thể kích hoạt giọng nói. Vui lòng kiểm tra API key.', 'error');
           }
        }, 2500)
    };
    
    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', () => {
        addToast('Không thể tải script ResponsiveVoice. API key có thể không hợp lệ hoặc có lỗi mạng.', 'error');
    });

    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', onScriptLoad);
      const scriptTag = document.getElementById(scriptId);
      if(scriptTag) scriptTag.remove();
      // Reset callback to avoid memory leaks
      window.responsiveVoice_onvoicesloaded = undefined;
    };
  }, [apiKey, addToast]);


  const handleApiKeySave = (key: string) => {
    const trimmedKey = key.trim();
    setApiKey(trimmedKey);
    localStorage.setItem('responsiveVoiceApiKey', trimmedKey);
    addToast('Đã lưu API Key.');
  };

  const processFile = useCallback(async (file: File, pageId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, status: 'processing', progress: 0 } : p));
    try {
      const sentences = await performOcr(file, (progress) => {
        setPages(prev => prev.map(p => p.id === pageId ? { ...p, progress } : p));
      });
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, status: 'done', sentences, progress: 1 } : p));
      addToast(`Đã xử lý xong ảnh: ${file.name}`);
    } catch (error) {
      console.error(`Failed to process ${file.name}`, error);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, status: 'error', progress: 0 } : p));
      addToast(`Lỗi khi xử lý ảnh: ${file.name}`, 'error');
    }
  }, [addToast]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newPages: ComicPage[] = files.map(file => ({
        id: `${file.name}-${Date.now()}`,
        file,
        url: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        sentences: [],
      }));

      setPages(prev => [...prev, ...newPages]);
      // Process files in parallel
      newPages.forEach(page => processFile(page.file, page.id));
    }
  };

  // Vocabulary generation
  useEffect(() => {
    const allText = pages
        .filter(p => p.status === 'done')
        .flatMap(p => p.sentences.map(s => s.text))
        .join('');

    if (allText) {
      const words = segmentWords(allText);
      const uniqueWords = [...new Set(words)];
      
      const vocabItems: VocabularyItem[] = uniqueWords
        .filter(word => word.trim().length > 0)
        .sort((a,b) => a.localeCompare(b, 'zh-Hans-CN'))
        .map(word => ({
          word,
          pinyin: getPinyin(word),
        }));
        
      setVocabulary(vocabItems);
    }
  }, [pages]);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasVocabulary={vocabulary.length > 0}
      />
      <main className="container mx-auto p-4 md:p-8">
        <SpeechConfig apiKey={apiKey} onApiKeySave={handleApiKeySave} isSpeechReady={isSpeechReady} />
        {activeTab === 'comics' && <ComicsView pages={pages} onFileUpload={handleFileUpload} isSpeechReady={isSpeechReady} />}
        {activeTab === 'vocabulary' && <VocabularyView vocabulary={vocabulary} isSpeechReady={isSpeechReady} />}
        {activeTab === 'tts-test' && <TtsTestView isSpeechReady={isSpeechReady} />}
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
