import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { Bell, Check, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlobalTimer } from '@/components/common/GlobalTimer';

interface NavbarProps {
    userId: string;
    userName: string;
    uniqueId?: string; // 6-digit unique ID
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

export const Navbar: React.FC<NavbarProps> = ({ userId, userName, uniqueId, onLogout }) => {
    const router = useRouter();

    // Notification state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Copy ID state
    const [copiedId, setCopiedId] = useState(false);

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

    const handleCopyId = async () => {
        if (!uniqueId) return;
        try {
            await navigator.clipboard.writeText(uniqueId);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } catch (error) {
            console.error('Failed to copy ID:', error);
        }
    };

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-white px-6 py-3 flex justify-between items-center shadow-lg">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                        B
                    </div>
                    <span className="font-semibold text-lg tracking-tight">Buxgaltersiz</span>
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
                    {/* User ID badge */}
                    {uniqueId && (
                        <button
                            onClick={handleCopyId}
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-full border bg-purple-500/10 border-purple-500/50 hover:bg-purple-500/20 transition-all cursor-pointer"
                            title="Click to copy ID"
                        >
                            <span className="text-xs text-purple-300 font-medium">ID:</span>
                            <span className="font-mono font-bold text-purple-200">{uniqueId}</span>
                            {copiedId ? (
                                <Check size={14} className="text-green-400" />
                            ) : (
                                <Copy size={14} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    )}
                    {/* Timer badge */}
                    <GlobalTimer userId={userId} variant="navbar" />

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-white">{userName}</div>
                            <div className="text-xs text-slate-400">Foydalanuvchi</div>
                        </div>
                        <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-medium border border-slate-700">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
                        >
                            Chiqish
                        </button>
                    </div>
                </div>
            </nav>
            {/* Spacer for fixed navbar */}
            <div className="h-16" />
        </>
    );
};
