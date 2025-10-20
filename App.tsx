import React, { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';

import Header from './components/Header';
import ComicsView from './components/ComicsView';
import VocabularyView from './components/VocabularyView';
import TtsTestView from './components/TtsTestView';
import SpeechConfig from './components/SpeechConfig';
import { ToastContainer } from './components/Toast';

import type { ComicPage, VocabularyItem, RecognizedSentence, ToastMessage } from './types';
import { recognizeText, initializeOcrWorker } from './services/ocrService';
import { getPinyin, segmentWords } from './services/chineseToolsService';

const API_KEY_STORAGE_KEY = 'responsiveVoiceApiKey';

function App() {
  const [activeTab, setActiveTab] = useState<'comics' | 'vocabulary' | 'tts-test'>('comics');
  const [comicPages, setComicPages] = useState<ComicPage[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [isSpeechReady, setIsSpeechReady] = useState<boolean>(false);

  // Pre-initialize the OCR worker on app load
  useEffect(() => {
    initializeOcrWorker();
  }, []);

  const addToast = useCallback((message: string, type: 'info' | 'error') => {
    const id = Date.now();
    setToasts(prevToasts => {
      if (prevToasts.some(toast => toast.message === message)) return prevToasts;
      return [...prevToasts, { id, message, type }];
    });
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Effect to dynamically load ResponsiveVoice script using a robust polling mechanism
  useEffect(() => {
    const existingScript = document.getElementById('responsivevoice-script');
    if (existingScript) {
      existingScript.remove();
    }
    setIsSpeechReady(false);

    if (!apiKey) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'responsivevoice-script';
    script.src = `https://code.responsivevoice.org/responsivevoice.js?key=${apiKey}`;
    script.async = true;

    let pollInterval: number | null = null;
    let timeoutId: number | null = null;

    script.onload = () => {
      const startTime = Date.now();
      const pollTimeLimit = 5000; // Wait for a maximum of 5 seconds

      pollInterval = window.setInterval(() => {
        // Check if the library is ready by seeing if it has loaded any voices
        if (window.responsiveVoice && window.responsiveVoice.getVoices().length > 0) {
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
          setIsSpeechReady(true);
          addToast('Tính năng phát âm đã sẵn sàng!', 'info');
        } else if (Date.now() - startTime > pollTimeLimit) {
          // If 5 seconds have passed and it's still not ready, give up.
          if (pollInterval) clearInterval(pollInterval);
          setIsSpeechReady(false);
          addToast('Không thể khởi tạo giọng đọc. API key có thể không hợp lệ hoặc đã hết hạn.', 'error');
        }
      }, 100); // Check every 100ms
    };

    script.onerror = () => {
      setIsSpeechReady(false);
      addToast('Lỗi tải script phát âm. Vui lòng kiểm tra kết nối mạng và API key.', 'error');
    };

    document.body.appendChild(script);

    // Cleanup function
    return () => {
      const scriptOnCleanup = document.getElementById('responsivevoice-script');
      if (scriptOnCleanup) {
        scriptOnCleanup.remove();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [apiKey, addToast]);
  
  const handleApiKeySave = (newKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setApiKey(newKey);
  };


  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPages: ComicPage[] = Array.from(files).map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      url: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      sentences: [],
    }));

    setComicPages(prevPages => [...prevPages, ...newPages]);
    setActiveTab('comics');
    event.target.value = '';
  };

  const processPage = useCallback(async (page: ComicPage) => {
    setComicPages(currentPages => currentPages.map(p => p.id === page.id ? { ...p, status: 'processing', progress: 0 } : p));
    
    try {
      const result = await recognizeText(page, (progress) => {
        setComicPages(currentPages => currentPages.map(p => p.id === page.id ? { ...p, progress } : p));
      });
      
      const sentences: RecognizedSentence[] = result.data.lines
          .map(line => line.text.replace(/\s+/g, ''))
          .filter(text => text.length > 0)
          .map((text, index) => ({
              id: `${page.id}-sentence-${index}`,
              text,
              pinyin: getPinyin(text)
          }));
      
      setComicPages(currentPages => currentPages.map(p => p.id === page.id ? { ...p, status: 'done', sentences, progress: 1 } : p));

      if (sentences.length === 0) {
        addToast('Không tìm thấy chữ nào trên ảnh này.', 'info');
      }

    } catch (error) {
      console.error('OCR Error:', error);
      setComicPages(currentPages => currentPages.map(p => p.id === page.id ? { ...p, status: 'error' } : p));
      addToast('Đã xảy ra lỗi khi nhận diện chữ.', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    const pendingPage = comicPages.find(p => p.status === 'pending');
    if (pendingPage) {
      processPage(pendingPage);
    }
  }, [comicPages, processPage]);

  useEffect(() => {
    const allText = comicPages.flatMap(page => page.sentences.map(s => s.text)).join('');
    
    if (allText.length > 0) {
      const words = segmentWords(allText);
      const uniqueWords = [...new Set(words)].filter(w => w.trim().length > 0);
      
      const newVocabulary: VocabularyItem[] = uniqueWords.map(word => ({
        word,
        pinyin: getPinyin(word)
      }));
      
      setVocabulary(newVocabulary);
    }
  }, [comicPages]);
  
  return (
    <div className="min-h-screen">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        hasVocabulary={vocabulary.length > 0} 
      />
      <main className="container mx-auto p-4 md:p-8">
        <SpeechConfig apiKey={apiKey} onApiKeySave={handleApiKeySave} isSpeechReady={isSpeechReady} />
        
        {activeTab === 'comics' && (
          <ComicsView pages={comicPages} onFileUpload={handleFileUpload} isSpeechReady={isSpeechReady} />
        )}
        {activeTab === 'vocabulary' && (
          <VocabularyView vocabulary={vocabulary} isSpeechReady={isSpeechReady} />
        )}
        {activeTab === 'tts-test' && (
          <TtsTestView isSpeechReady={isSpeechReady} />
        )}
      </main>
    </div>
  );
}

export default App;