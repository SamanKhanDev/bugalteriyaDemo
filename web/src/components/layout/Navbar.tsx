import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, Timestamp, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { UserTimer } from '@/lib/schema';
import TimeExpiredModal from '@/components/modals/TimeExpiredModal';
import { Bell, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    userId: string;
    userName: string;
    onLogout: () => void;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: any;
}

const SYNC_INTERVAL_MS = 30000; // 30 seconds

export const Navbar: React.FC<NavbarProps> = ({ userId, userName, onLogout }) => {
    const router = useRouter();
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [showExpiredModal, setShowExpiredModal] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncedRef = useRef<number>(Date.now());
    const localTimeRef = useRef<number>(0);

    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

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

    // Notifications listener
    useEffect(() => {
        if (!userId) return;
        let unsubscribeQuery: () => void;
        const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser: User | null) => {
            if (firebaseUser && firebaseUser.uid === userId) {
                const q = query(
                    collection(db, 'notifications'),
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                unsubscribeQuery = onSnapshot(
                    q,
                    (snapshot) => {
                        const notifs = snapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        } as Notification));
                        setNotifications(notifs);
                        setUnreadCount(notifs.filter((n) => !n.read).length);
                    },
                    (error) => {
                        if (error?.code !== 'permission-denied') {
                            console.error('Notification listener error:', error);
                        }
                    }
                );
            } else {
                setNotifications([]);
                setUnreadCount(0);
                if (unsubscribeQuery) unsubscribeQuery();
            }
        });
        return () => {
            unsubscribeAuth();
            if (unsubscribeQuery) unsubscribeQuery();
        };
    }, [userId]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            try {
                await updateDoc(doc(db, 'notifications', notification.id), { read: true });
            } catch (e) {
                console.error('Error marking notification as read:', e);
            }
        }
        if (notification.link) {
            router.push(notification.link);
            setShowNotifications(false);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter((n) => !n.read);
        for (const n of unread) {
            try {
                await updateDoc(doc(db, 'notifications', n.id), { read: true });
            } catch (e) {
                console.error('Error marking notification as read:', e);
            }
        }
    };

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

    return (
        <>
            {showExpiredModal && <TimeExpiredModal onContactAdmin={handleContactAdmin} />}
            <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-white px-6 py-3 flex justify-between items-center shadow-lg">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                        A
                    </div>
                    <span className="font-semibold text-lg tracking-tight">Accounting Academy</span>
                </div>
                {/* Links */}
                <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
                    <a href="/dashboard" className="hover:text-white transition-colors">
                        Dashboard
                    </a>
                    <a href="/leaderboard" className="hover:text-white transition-colors">
                        Reyting
                    </a>
                </div>
                {/* Right side */}
                <div className="flex items-center gap-4">
                    {/* Notification bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900" />
                            )}
                        </button>
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                                        <h3 className="font-semibold text-sm text-white">Xabarnomalar</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                                <Check size={12} /> O'qilgan deb belgilash
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500">
                                                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Xabarnomalar yo'q</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-800">
                                                {notifications.map((notif) => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={`p-4 hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-slate-800/20' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-purple-500' : 'bg-slate-600'}`} />
                                                            <div>
                                                                <p className={`text-sm font-medium mb-1 ${!notif.read ? 'text-white' : 'text-slate-400'}`}>{notif.title}</p>
                                                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{notif.message}</p>
                                                                <p className="text-[10px] text-slate-600">
                                                                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Hozirgina'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Timer badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isExpired ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-800 border-slate-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-mono font-medium">
                            {remainingTime !== null ? formatTime(remainingTime) : '--:--:--'}
                        </span>
                    </div>
                    {/* Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-slate-400">Welcome back,</div>
                            <div className="text-sm font-medium">{userName}</div>
                        </div>
                        <button onClick={onLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors" title="Logout">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};
