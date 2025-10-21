import React, { useState } from 'react';
import type { FC } from 'react';
import { getAudioContext, fetchAudioData, playAudioBuffer } from '../services/chineseToolsService';
import { SpeakerIcon } from './Icons';

export const LoadingSpinner: FC<{ className?: string }> = ({ className = "h-5 w-5 text-white" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


interface AudioButtonProps {
    textToSpeak: string;
    addToast: (message: string, type?: 'info' | 'error') => void;
    className?: string;
    iconClassName?: string;
    preloadedBuffer?: AudioBuffer | null;
    isPreloading?: boolean;
}

export const AudioButton: FC<AudioButtonProps> = ({ 
    textToSpeak, 
    addToast, 
    className, 
    iconClassName = "w-5 h-5",
    preloadedBuffer,
    isPreloading
}) => {
    const [isFetchingOnClick, setIsFetchingOnClick] = useState(false);

    const handlePlay = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card clicks or other parent events
        if (isFetchingOnClick || isPreloading) return;

        const audioCtx = getAudioContext();

        try {
            if (preloadedBuffer) {
                playAudioBuffer(preloadedBuffer, audioCtx);
            } else {
                setIsFetchingOnClick(true);
                const buffer = await fetchAudioData(textToSpeak, audioCtx);
                playAudioBuffer(buffer, audioCtx);
            }
        } catch (error) {
            console.error(`Failed to play audio for "${textToSpeak}"`, error);
            if (error instanceof Error && error.message.includes("No audio data")) {
                 addToast(`Không có dữ liệu âm thanh cho "${textToSpeak}"`, 'error');
            } else {
                 addToast(`Không thể phát âm thanh.`, 'error');
            }
        } finally {
            setIsFetchingOnClick(false);
        }
    };

    const isLoading = isPreloading || isFetchingOnClick;

    return (
        <button
            onClick={handlePlay}
            disabled={isLoading}
            className={`p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50 ${className}`}
            title="Phát âm"
        >
            {isLoading ? <LoadingSpinner className={`${iconClassName} text-slate-500`} /> : <SpeakerIcon className={iconClassName} />}
        </button>
    );
};
