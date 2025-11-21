import { create } from 'zustand';
import { User } from '@/lib/schema';

interface AppState {
    user: User | null;
    isLoading: boolean; // General loading (e.g. page transitions)
    isLoadingAuth: boolean; // Specific to initial auth check
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setLoadingAuth: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    isLoading: false,
    isLoadingAuth: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ isLoading: loading }),
    setLoadingAuth: (loading) => set({ isLoadingAuth: loading }),
}));

