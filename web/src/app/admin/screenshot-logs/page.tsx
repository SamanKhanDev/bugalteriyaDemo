'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useStore } from '../../../store/useStore';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle, User, FileText, Clock, Monitor, Trash2, Eraser } from 'lucide-react';

interface ScreenshotAttempt {
    id: string;
    userId: string;
    userName: string;
    testId: string;
    testTitle: string;
    attemptType: string;
    timestamp: Timestamp;
    userAgent: string;
}

export default function ScreenshotLogsPage() {
    const { user } = useStore();
    const router = useRouter();
    const [attempts, setAttempts] = useState<ScreenshotAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, today, week
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        // Check if user is admin
        if (!user || user.role !== 'admin') {
            router.push('/');
            return;
        }

        // Real-time listener
        const q = query(
            collection(db, 'screenshotAttempts'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ScreenshotAttempt[];

            setAttempts(data);
            setLoading(false);
        }, (error) => {
            console.error('Error loading attempts:', error);
            if (error.code === 'permission-denied') {
                alert('Firestore ruxsatnomasi yo\'q! Iltimos, Firebase Console qoidalarini tekshiring.');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, router]);

    const handleDelete = async (id: string) => {
        if (!confirm('Haqiqatan ham bu yozuvni o\'chirmoqchimisiz?')) return;

        try {
            await deleteDoc(doc(db, 'screenshotAttempts', id));
        } catch (error) {
            console.error('Error deleting log:', error);
            alert('Xatolik yuz berdi');
        }
    };

    const handleClearAll = async () => {
        if (!confirm('DIQQAT: Barcha loglarni o\'chirib yubormoqchimisiz? Bu amalni qaytarib bo\'lmaydi!')) return;

        setIsDeleting(true);
        try {
            // Get all docs (not just limit 100)
            const q = query(collection(db, 'screenshotAttempts'));
            const snapshot = await getDocs(q);

            // Delete in batches (max 500 per batch)
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            alert('Barcha loglar tozalandi!');
        } catch (error) {
            console.error('Error clearing logs:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setIsDeleting(false);
        }
    };

    const filterAttempts = () => {
        const now = new Date();
        return attempts.filter(attempt => {
            if (filter === 'all') return true;

            const attemptDate = attempt.timestamp?.toDate ? attempt.timestamp.toDate() : new Date();

            if (filter === 'today') {
                return attemptDate.toDateString() === now.toDateString();
            }

            if (filter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return attemptDate >= weekAgo;
            }

            return true;
        });
    };

    const getAttemptBadge = (type: string) => {
        if (type.includes('PrintScreen')) {
            return 'bg-red-500/20 text-red-400 border-red-500/30';
        }
        if (type.includes('Snipping')) {
            return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        }
        if (type.includes('Hidden')) {
            return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white text-xl">Yuklanmoqda...</div>
            </div>
        );
    }

    const filtered = filterAttempts();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Shield className="w-12 h-12 text-red-500" />
                    <div>
                        <h1 className="text-4xl font-bold text-white">Screenshot Attempt Logs</h1>
                        <p className="text-slate-400">Barcha screenshot urinishlari (Real-time)</p>
                    </div>
                </div>

                <button
                    onClick={handleClearAll}
                    disabled={isDeleting || attempts.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeleting ? (
                        <span>Tozalanmoqda...</span>
                    ) : (
                        <>
                            <Eraser size={20} />
                            <span>Tarixni Tozalash</span>
                        </>
                    )}
                </button>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                            <div>
                                <p className="text-slate-400 text-sm">Jami Urinishlar</p>
                                <p className="text-3xl font-bold text-white">{attempts.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-orange-500" />
                            <div>
                                <p className="text-slate-400 text-sm">Bugun</p>
                                <p className="text-3xl font-bold text-white">
                                    {attempts.filter(a => a.timestamp?.toDate && a.timestamp.toDate().toDateString() === new Date().toDateString()).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <User className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-slate-400 text-sm">Noyob Foydalanuvchilar</p>
                                <p className="text-3xl font-bold text-white">
                                    {new Set(attempts.map(a => a.userId)).size}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Hammasi
                    </button>
                    <button
                        onClick={() => setFilter('today')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'today'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Bugun
                    </button>
                    <button
                        onClick={() => setFilter('week')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'week'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Bu Hafta
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr className="border-b border-slate-700">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Foydalanuvchi
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Test
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Urinish Turi
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Vaqt
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Brauzer
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                                        Amal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            Hech qanday urinish topilmadi
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((attempt) => (
                                        <tr key={attempt.id} className="hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <p className="text-white font-medium">{attempt.userName}</p>
                                                        <p className="text-slate-400 text-sm">{attempt.userId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <p className="text-white">{attempt.testTitle}</p>
                                                        <p className="text-slate-400 text-sm">{attempt.testId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getAttemptBadge(attempt.attemptType)}`}>
                                                    {attempt.attemptType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{attempt.timestamp?.toDate ? attempt.timestamp.toDate().toLocaleString('uz-UZ') : 'Noma\'lum'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-400 text-sm max-w-xs truncate">
                                                    <Monitor className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{attempt.userAgent}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(attempt.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                                    title="O'chirish"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
