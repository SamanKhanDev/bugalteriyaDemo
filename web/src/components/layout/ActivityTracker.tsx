'use client';

import { useEffect, useRef } from 'react';
import { doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';

const ACTIVITY_INTERVAL_MS = 60000; // Update every 60 seconds

export default function ActivityTracker() {
    const { user } = useStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;

        const updateActivity = async () => {
            if (document.visibilityState === 'visible') {
                try {
                    const userRef = doc(db, 'users', user.userId);
                    await updateDoc(userRef, {
                        totalActiveSeconds: increment(60),
                        lastSeen: Timestamp.now()
                    });
                    console.log('Activity tracked: +60s');
                } catch (error) {
                    console.error('Failed to track activity:', error);
                }
            }
        };

        intervalRef.current = setInterval(updateActivity, ACTIVITY_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user]);

    return null; // Headless component
}
