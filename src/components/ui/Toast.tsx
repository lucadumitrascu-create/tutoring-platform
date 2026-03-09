'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(showTimer);
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for the exit animation before calling onClose
      setTimeout(onClose, 200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="bg-paper border-2 border-sketch px-5 py-3 rounded-lg shadow-lg flex items-center gap-3">
        {/* Icon */}
        {type === 'success' ? (
          <svg
            className="w-5 h-5 text-green-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}

        {/* Message */}
        <span className="text-sm text-ink">{message}</span>

        {/* Close button */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 200);
          }}
          className="text-ink-muted hover:text-ink ml-1 flex-shrink-0 transition-colors"
          aria-label="Inchide"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
