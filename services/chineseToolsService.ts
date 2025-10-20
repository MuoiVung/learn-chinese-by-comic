/**
 * Converts a Chinese string to pinyin using the global pinyinPro library.
 * @param text The Chinese text.
 * @returns The pinyin representation of the text.
 */
export const getPinyin = (text: string): string => {
  // The pinyinPro library is loaded from a CDN and available on the window object.
  if (window.pinyinPro) {
    return window.pinyinPro.pinyin(text, { toneType: 'num' });
  }
  console.warn('pinyinPro library is not available.');
  return '';
};

/**
 * Segments a Chinese string into words using the global jieba library.
 * @param text The Chinese text.
 * @returns An array of words.
 */
export const segmentWords = (text: string): string[] => {
  // The jieba library is loaded from a CDN and available on the window object.
  if (window.jieba) {
    return window.jieba.cut(text);
  }
  console.warn('jieba library is not available.');
  // Fallback if jieba is not available.
  return [text];
};

/**
 * Uses ResponsiveVoice to speak the given text in Chinese.
 * @param text The text to speak.
 */
export const speakText = (text: string): void => {
  // The responsiveVoice library is loaded from a CDN and available on the window object.
  if (window.responsiveVoice) {
    // By providing the `lang` option, we make the call more robust.
    // If 'Chinese Female' is not immediately available, the library will try to find
    // another suitable voice for the Chinese language ('zh-CN').
    // This fixes the issue where the speak command would fail silently.
    window.responsiveVoice.speak(text, 'Chinese Female', { lang: 'zh-CN' });
  } else {
    console.error('ResponsiveVoice library is not available.');
  }
};
