'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirma',
  cancelLabel = 'Anuleaza',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus the cancel button when the modal opens
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Handle Escape key to cancel
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="bg-paper border-2 border-sketch rounded-lg p-6 max-w-sm w-full mx-auto"
        onKeyDown={handleKeyDown}
      >
        <h2 id="confirm-modal-title" className="text-lg font-hand text-ink font-bold">
          {title}
        </h2>
        <p id="confirm-modal-message" className="text-sm text-ink-light mt-2">
          {message}
        </p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm text-ink-lighter hover:text-ink border border-sketch rounded-lg hover:bg-[#f0e8d8] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={
              danger
                ? 'px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                : 'px-4 py-2 text-sm bg-sketch-dark text-paper rounded-lg hover:bg-ink transition-colors'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
