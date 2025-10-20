import React from 'react';
import type { ChangeEvent, FC } from 'react';
import type { ComicPage as ComicPageType } from '../types';
import ComicPage from './ComicPage';
import { UploadIcon } from './Icons';

interface ComicsViewProps {
  pages: ComicPageType[];
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  isSpeechReady: boolean;
}

const ComicsView: FC<ComicsViewProps> = ({ pages, onFileUpload, isSpeechReady }) => {
  return (
    <div>
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-400px)]">
          <label htmlFor="file-upload" className="cursor-pointer p-8 border-2 border-dashed border-slate-400 rounded-lg text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
            <div className="flex flex-col items-center">
              <UploadIcon className="w-16 h-16 mb-4"/>
              <h2 className="text-2xl font-bold mb-2">Tải lên ảnh truyện tranh</h2>
              <p>Chọn một hoặc nhiều ảnh (JPG, PNG) để bắt đầu.</p>
              <p className="mt-2 text-sm text-slate-400">Mọi xử lý đều diễn ra trên trình duyệt của bạn.</p>
            </div>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/png, image/jpeg"
            multiple
            onChange={onFileUpload}
            className="hidden"
          />
        </div>
      ) : (
         <div className="space-y-8">
          <div className="text-center">
              <label htmlFor="file-upload-more" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                Thêm ảnh khác
              </label>
              <input
                id="file-upload-more"
                type="file"
                accept="image/png, image/jpeg"
                multiple
                onChange={onFileUpload}
                className="hidden"
              />
          </div>
          {pages.map((page, index) => (
            <ComicPage key={page.id} page={page} pageNumber={index + 1} isSpeechReady={isSpeechReady} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComicsView;