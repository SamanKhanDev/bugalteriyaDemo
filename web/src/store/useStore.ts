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
    isLoading: boolean; // General loading (e.g. page transitions)
    isLoadingAuth: boolean; // Specific to initial auth check
    setUser: (user: User | null) => void;
    setGuestUser: (guestUser: GuestUser | null) => void;
    setLoading: (loading: boolean) => void;
    setLoadingAuth: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    guestUser: null,
    isLoading: false,
    isLoadingAuth: true,
    setUser: (user) => set({ user }),
    setGuestUser: (guestUser) => set({ guestUser }),
    setLoading: (loading) => set({ isLoading: loading }),
    setLoadingAuth: (loading) => set({ isLoadingAuth: loading }),
}));

