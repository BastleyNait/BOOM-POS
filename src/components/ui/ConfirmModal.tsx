'use client';

import React from 'react';
import { useConfirmStore } from '../../store/useConfirmStore';

export function ConfirmModal() {
  const { isOpen, message, safeAction, confirm, cancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
            <span className="text-xl">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmación Requerida</h3>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex border-t border-slate-100">
          <button
            onClick={cancel}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-r border-slate-100
              ${safeAction === 'cancel' 
                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' 
                : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors
              ${safeAction === 'confirm' 
                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' 
                : 'bg-white text-rose-600 hover:bg-rose-50'}`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
