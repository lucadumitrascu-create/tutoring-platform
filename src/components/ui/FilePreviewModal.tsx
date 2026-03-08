'use client';

import { useEffect, useCallback } from 'react';

interface PreviewFile {
  url: string;
  type: string;
  name: string;
}

interface FilePreviewModalProps {
  files: PreviewFile[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function FilePreviewModal({ files, currentIndex, onClose, onNavigate }: FilePreviewModalProps) {
  const file = files[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isVideo = file.type.startsWith('video/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* File name */}
      <div className="absolute top-4 left-4 z-10 text-white/80 text-sm truncate max-w-[60%]">
        {file.name} ({currentIndex + 1}/{files.length})
      </div>

      {/* Nav arrows */}
      {hasPrev && (
        <button onClick={() => onNavigate(currentIndex - 1)} className="absolute left-4 z-10 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      {hasNext && (
        <button onClick={() => onNavigate(currentIndex + 1)} className="absolute right-4 z-10 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Content */}
      <div className="relative z-[5] max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {isImage && (
          <img src={file.url} alt={file.name} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        )}
        {isPdf && (
          <iframe src={file.url} className="w-[90vw] h-[85vh] rounded-lg bg-white" title={file.name} />
        )}
        {isVideo && (
          <video src={file.url} controls className="max-w-full max-h-[85vh] rounded-lg" />
        )}
      </div>
    </div>
  );
}
