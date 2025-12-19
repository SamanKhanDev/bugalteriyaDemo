'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { User } from '@/lib/schema';
import { useRouter, usePathname } from 'next/navigation';
import { generateUniqueId } from '@/lib/generateUniqueId';

import ActivityTracker from '@/components/layout/ActivityTracker';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setGuestUser, setLoadingAuth, user, isLoadingAuth } = useStore();
    const router = useRouter();
    const pathname = usePathname();

    const unsubscribeProfileRef = useRef<(() => void) | null>(null);

    // Initialize Guest User from localStorage
    useEffect(() => {
        const storedGuest = localStorage.getItem('guestUser');
        if (storedGuest) {
            try {
                setGuestUser(JSON.parse(storedGuest));
            } catch (e) {
                console.error('Error parsing guest user from storage:', e);
            }
        }
    }, [setGuestUser]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            // Always unsubscribe from previous profile listener when auth state changes
            if (unsubscribeProfileRef.current) {
                unsubscribeProfileRef.current();
                unsubscribeProfileRef.current = null;
            }

            if (firebaseUser) {
                setLoadingAuth(true);
                // User is signed in, fetch profile
                const userDocRef = doc(db, 'users', firebaseUser.uid);

                // Real-time listener for user profile changes
                unsubscribeProfileRef.current = onSnapshot(userDocRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data() as User;

                        // Check if user doesn't have uniqueId and add it
                        if (!userData.uniqueId) {
                            try {
                                console.log('🔄 Generating uniqueId for existing user:', userData.name);
                                const uniqueId = await generateUniqueId();
                                await updateDoc(userDocRef, { uniqueId });
                                console.log('✅ UniqueId generated:', uniqueId);
                                // The onSnapshot will automatically update with the new data
                            } catch (error) {
                                console.error('❌ Failed to generate uniqueId:', error);
                                // Still set the user even if uniqueId generation fails
                                setUser(userData);
                            }
                        } else {
                            setUser(userData);
                        }
                    } else {
                        // User authenticated but doc doesn't exist yet (e.g. during registration)
                        console.log('User document not found yet');
                    }
                    setLoadingAuth(false);
                }, (error) => {
                    // Ignore permission errors that happen during logout
                    if (error.code !== 'permission-denied') {
                        console.error("Error fetching user profile:", error);
                    }
                    setLoadingAuth(false);
                });
            } else {
                // User is signed out
                setUser(null);
                setLoadingAuth(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfileRef.current) {
                unsubscribeProfileRef.current();
            }
        };
    }, [setUser, setLoadingAuth]);

    // Protected Route Logic
    // Protected Route Logic
    useEffect(() => {
        const authPaths = ['/auth/login', '/auth/register', '/admin/auth'];
        const publicPaths = ['/', ...authPaths];
        const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/quick-tests');
        const isAuthPath = authPaths.includes(pathname);

        // Redirect unauthenticated users from protected routes
        if (!isLoadingAuth && !user && !isPublicPath) {
            router.push('/auth/login');
        }

        // Redirect authenticated users ONLY from auth pages (login/register)
        if (!isLoadingAuth && user && isAuthPath) {
            if (user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        }
    }, [user, isLoadingAuth, pathname, router]);

    return (
        <>
            <ActivityTracker />
            {children}
        </>
    );
}
