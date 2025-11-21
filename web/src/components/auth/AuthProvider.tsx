'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { User } from '@/lib/schema';
import { useRouter, usePathname } from 'next/navigation';

import ActivityTracker from '@/components/layout/ActivityTracker';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoadingAuth, user, isLoadingAuth } = useStore();
    const router = useRouter();
    const pathname = usePathname();

    const unsubscribeProfileRef = useRef<(() => void) | null>(null);

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
                unsubscribeProfileRef.current = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUser(docSnap.data() as User);
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
    useEffect(() => {
        const publicPaths = ['/', '/auth/login', '/auth/register', '/admin/auth'];
        const isPublicPath = publicPaths.includes(pathname);

        if (!isLoadingAuth && !user && !isPublicPath) {
            router.push('/auth/login');
        }

        if (!isLoadingAuth && user && isPublicPath && pathname !== '/') {
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
