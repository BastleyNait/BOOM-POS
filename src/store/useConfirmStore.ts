import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  message: string;
  safeAction: 'confirm' | 'cancel'; // Indica qué botón debe estar resaltado (default 'cancel' para no perder datos)
  resolvePromise: ((value: boolean) => void) | null;
  requestConfirm: (message: string, safeAction?: 'confirm' | 'cancel') => Promise<boolean>;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  message: '',
  safeAction: 'cancel',
  resolvePromise: null,
  
  requestConfirm: (message, safeAction = 'cancel') => {
    return new Promise((resolve) => {
      set({ isOpen: true, message, safeAction, resolvePromise: resolve });
    });
  },
  
  confirm: () => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(true);
    set({ isOpen: false, resolvePromise: null });
  },
  
  cancel: () => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(false);
    set({ isOpen: false, resolvePromise: null });
  }
}));
