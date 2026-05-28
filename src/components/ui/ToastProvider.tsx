'use client';

import React, { useEffect, useState } from 'react';
import { useToastStore, Toast } from '../../store/useToastStore';

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Disparar animación de entrada
    const enterTimer = setTimeout(() => setIsMounted(true), 10);

    // Disparar animación de salida a los 4.5s
    const exitTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 4500);

    // Remover del DOM 300ms después de que empiece a salir
    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, 4800);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  let colorClasses = 'bg-slate-50 text-slate-800 border-slate-200';
  let icon = (
    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  if (toast.type === 'error') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    icon = (
      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (toast.type === 'success') {
    colorClasses = 'bg-orange-50 text-orange-800 border-orange-200';
    icon = (
      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (toast.type === 'warning') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = (
      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all duration-300 ease-out transform
        ${isMounted && !isLeaving ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
        ${colorClasses}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-[13px] font-semibold leading-snug flex-1">
        {toast.message}
      </p>
      <button
        onClick={handleClose}
        className="opacity-50 hover:opacity-100 transition-opacity p-0.5 rounded-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
