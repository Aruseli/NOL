import { create } from 'zustand';

interface LoadingStore {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({ // Добавим get для логгирования
  isLoading: false,
  showLoader: () => {
    console.log('STORE: Called showLoader. Current state:', get().isLoading);
    set({ isLoading: true });
    console.log('STORE: State after showLoader:', get().isLoading);
  },
  hideLoader: () => {
    console.log('STORE: Called hideLoader. Current state:', get().isLoading);
    set({ isLoading: false });
    console.log('STORE: State after hideLoader:', get().isLoading);
  },
}));