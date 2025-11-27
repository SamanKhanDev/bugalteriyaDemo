import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { UserTimer } from '@/lib/schema';
import TimeExpiredModal from '@/components/modals/TimeExpiredModal';
import { Clock } from 'lucide-react';

interface GlobalTimerProps {
    userId: string;
    variant?: 'navbar' | 'overlay';
    className?: string;
}

const SYNC_INTERVAL_MS = 30000; // 30 seconds

export const GlobalTimer: React.FC<GlobalTimerProps> = ({ userId, variant = 'navbar', className = '' }) => {
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [showExpiredModal, setShowExpiredModal] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncedRef = useRef<number>(Date.now());
    const localTimeRef = useRef<number>(0);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Timer listener
    useEffect(() => {
        if (!userId) return;
        let unsubscribeTimer: () => void;
        const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser: User | null) => {
            if (firebaseUser && firebaseUser.uid === userId) {
                const timerDocRef = doc(db, 'userTimers', userId);
                unsubscribeTimer = onSnapshot(
                    timerDocRef,
                    (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data() as UserTimer;
                            const serverTime = data.remainingTime;
                            const isSignificantlyGreater = serverTime > localTimeRef.current + 5;
                            const isValidReset =
                                localTimeRef.current === 0 ? serverTime > 30 : isSignificantlyGreater;
                            if (localTimeRef.current === 0 && remainingTime === null) {
                                setRemainingTime(serverTime);
                                localTimeRef.current = serverTime;
                            } else if (isValidReset) {
                                setRemainingTime(serverTime);
                                localTimeRef.current = serverTime;
                                lastSyncedRef.current = Date.now();
                                if (serverTime > 0) {
                                    setIsExpired(false);
                                    setShowExpiredModal(false);
                                }
                            }
                        }
                    },
                    (error) => {
                        if (error?.code !== 'permission-denied') {
                            console.error('Timer listener error:', error);
                        }
                    }
                );
            } else {
                if (unsubscribeTimer) unsubscribeTimer();
            }
        });
        return () => {
            unsubscribeAuth();
            if (unsubscribeTimer) unsubscribeTimer();
        };
    }, [userId]);

    // Local countdown interval
    useEffect(() => {
        if (remainingTime === null) return;
        timerRef.current = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev === null) return null;
                if (prev <= 0) {
                    if (prev === 0 && !isExpired) {
                        setIsExpired(true);
                        setShowExpiredModal(true);
                        localTimeRef.current = 0;
                        syncToFirestore(0);
                    }
                    return 0;
                }
                const newVal = prev - 1;
                localTimeRef.current = newVal;
                const now = Date.now();
                if (now - lastSyncedRef.current > SYNC_INTERVAL_MS) {
                    syncToFirestore(newVal);
                    lastSyncedRef.current = now;
                }
                return newVal;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [remainingTime, isExpired]);

    const syncToFirestore = async (seconds: number) => {
        if (!userId) return;
        try {
            const timerDocRef = doc(db, 'userTimers', userId);
            await updateDoc(timerDocRef, {
                remainingTime: seconds,
                lastSyncedAt: Timestamp.now(),
            });
        } catch (e) {
            console.error('Failed to sync timer:', e);
        }
    };

    const handleContactAdmin = () => {
        window.location.href =
            "mailto:admin@accounting.uz?subject=Vaqt%20Tugadi%20-%20To'lov%20Qilish";
    };

    if (remainingTime === null) return null;

    if (variant === 'overlay') {
        return (
            <>
                {showExpiredModal && <TimeExpiredModal onContactAdmin={handleContactAdmin} />}
                <div className={`fixed top-4 right-4 z-50 pointer-events-none ${className}`}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-colors ${isExpired
                            ? 'bg-red-500/20 border-red-500/50 text-red-400'
                            : 'bg-slate-900/40 border-slate-700/50 text-slate-300'
                        }`}>
                        <Clock size={16} className={isExpired ? "animate-pulse" : ""} />
                        <span className="font-mono font-bold text-lg tracking-wider">
                            {formatTime(remainingTime)}
                        </span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {showExpiredModal && <TimeExpiredModal onContactAdmin={handleContactAdmin} />}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isExpired
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : 'bg-slate-800 border-slate-700'
                } ${className}`}
            >
                <Clock size={16} className={isExpired ? "animate-pulse" : "text-cyan-500"} />
                <span className={`font-mono font-bold ${isExpired ? 'text-red-400' : 'text-cyan-400'}`}>
                    {formatTime(remainingTime)}
                </span>
            </div>
        </>
    );
};
