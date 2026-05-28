'use client';

import React from 'react';
import { useConfirmStore } from '../../store/useConfirmStore';

export function ConfirmModal() {
  const { isOpen, message, safeAction, confirm, cancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl shadow-modal w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-caution-subtle mb-4">
            <svg className="h-6 w-6 text-caution" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink mb-2">Confirmación Requerida</h3>
          <p className="text-sm text-ink-secondary font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex border-t border-edge">
          <button
            onClick={cancel}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 ease-expo border-r border-edge active:scale-[0.98]
              ${safeAction === 'cancel' 
                ? 'bg-brand-subtle text-brand-text hover:bg-brand-subtle/80' 
                : 'bg-surface text-ink-secondary hover:bg-inset'}`}
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 ease-expo active:scale-[0.98]
              ${safeAction === 'confirm' 
                ? 'bg-brand-subtle text-brand-text hover:bg-brand-subtle/80' 
                : 'bg-surface text-negative hover:bg-negative-subtle'}`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
