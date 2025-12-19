import { create } from 'zustand';
import { User } from '@/lib/schema';

export interface GuestUser {
    userId: string;
    name: string;
    isGuest: boolean;
}

interface AppState {
    user: User | null;
    guestUser: GuestUser | null;
    currentTest: { id: string; title: string } | null;
    isLoading: boolean;
    isLoadingAuth: boolean;
    setUser: (user: User | null) => void;
    setGuestUser: (guestUser: GuestUser | null) => void;
    setCurrentTest: (test: { id: string; title: string } | null) => void;
    setLoading: (loading: boolean) => void;
    setLoadingAuth: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    guestUser: null,
    currentTest: null,
    isLoading: false,
    isLoadingAuth: true,
    setUser: (user) => set({ user }),
    setGuestUser: (guestUser) => set({ guestUser }),
    setCurrentTest: (currentTest) => set({ currentTest }),
    setLoading: (loading) => set({ isLoading: loading }),
    setLoadingAuth: (loading) => set({ isLoadingAuth: loading }),
}));

