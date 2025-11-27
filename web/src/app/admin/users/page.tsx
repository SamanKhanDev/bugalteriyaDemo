'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { User } from '@/lib/schema';
import { Users, Clock, Calendar, BarChart2, Lock, Key, Timer, Copy, Check, Zap } from 'lucide-react';
import AddTimeModal from '@/components/admin/AddTimeModal';
import UserProgressModal from '@/components/admin/UserProgressModal';
import { generateUniqueId } from '@/lib/generateUniqueId';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [userTimers, setUserTimers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [progressUser, setProgressUser] = useState<User | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [resetLoading, setResetLoading] = useState<string | null>(null);
    const [setPasswordLoading, setSetPasswordLoading] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [generatingIds, setGeneratingIds] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => doc.data() as User);
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching users:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch timers for all users
    useEffect(() => {
        const timerRef = collection(db, 'userTimers');
        const unsubscribe = onSnapshot(query(timerRef), (snapshot) => {
            const timers: Record<string, number> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                timers[doc.id] = data.remainingTime || 0;
            });
            setUserTimers(timers);
        });

        return () => unsubscribe();
    }, []);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}s ${minutes}d ${secs}s`;
    };

    const formatTimerTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}:${String(minutes).padStart(2, '0')}`;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCopyId = async (uniqueId: string) => {
        try {
            await navigator.clipboard.writeText(uniqueId);
            setCopiedId(uniqueId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleAddTime = (user: User) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleShowProgress = (user: User) => {
        setProgressUser(user);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const handleResetPassword = async (user: User) => {
        if (!confirm(`${user.email} uchun parolni tiklash havolasini yuborishni xohlaysizmi?`)) return;

        setResetLoading(user.userId);
        try {
            await sendPasswordResetEmail(auth, user.email);
            alert(`Parolni tiklash havolasi ${user.email} ga yuborildi!`);
        } catch (error: any) {
            console.error('Error sending reset email:', error);
            alert('Xatolik yuz berdi: ' + error.message);
        } finally {
            setResetLoading(null);
        }
    };

    const handleSetPassword = async (user: User) => {
        const newPassword = prompt(`${user.email} uchun yangi parolni kiriting (kamida 6 belgi):`);
        if (!newPassword) return;

        if (newPassword.length < 6) {
            alert('Parol kamida 6 belgidan iborat bo\'lishi kerak');
            return;
        }

        setSetPasswordLoading(user.userId);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch('/api/admin/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.userId,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            alert('Parol muvaffaqiyatli o\'zgartirildi!');
        } catch (error: any) {
            console.error('Error setting password:', error);
            alert('Xatolik: ' + error.message);
        } finally {
            setSetPasswordLoading(null);
        }
    };

    const handleGenerateAllIds = async () => {
        const usersWithoutId = users.filter(u => !u.uniqueId);

        if (usersWithoutId.length === 0) {
            alert('Barcha foydalanuvchilar allaqachon ID ga ega!');
            return;
        }

        if (!confirm(`${usersWithoutId.length} ta foydalanuvchiga ID yaratilsinmi?`)) {
            return;
        }

        setGeneratingIds(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const user of usersWithoutId) {
                try {
                    const uniqueId = await generateUniqueId();
                    const userRef = doc(db, 'users', user.userId);
                    await updateDoc(userRef, { uniqueId });
                    successCount++;
                    console.log(`✅ ID generated for ${user.name}: ${uniqueId}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to generate ID for ${user.name}:`, error);
                }
            }

            alert(`✅ Tayyor!\n\nMuvaffaqiyatli: ${successCount}\nXatolik: ${errorCount}`);
        } catch (error) {
            console.error('Bulk ID generation error:', error);
            alert('Xatolik yuz berdi!');
        } finally {
            setGeneratingIds(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Foydalanuvchilar</h1>
                    <p className="text-slate-400">Barcha foydalanuvchilarni boshqaring (Real-time)</p>
                </div>
                <button
                    onClick={handleGenerateAllIds}
                    disabled={generatingIds || users.filter(u => !u.uniqueId).length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generatingIds ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>ID lar yaratilmoqda...</span>
                        </>
                    ) : (
                        <>
                            <Zap size={20} />
                            <span>Barcha ID larni yaratish ({users.filter(u => !u.uniqueId).length})</span>
                        </>
                    )}
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Ism</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">User ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Telefon</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rol</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Qolgan Vaqt</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Faol Vaqt</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Oxirgi Kirish</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map((user) => {
                                const remainingTime = userTimers[user.userId] || 0;
                                const isExpired = remainingTime <= 0;

                                return (
                                    <tr key={user.userId} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.name}</div>
                                                    <div className="text-xs text-slate-500">UID: {user.userId.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.uniqueId ? (
                                                <button
                                                    onClick={() => handleCopyId(user.uniqueId)}
                                                    className="group flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all"
                                                    title="Click to copy"
                                                >
                                                    <span className="font-mono font-bold text-purple-300">
                                                        {user.uniqueId}
                                                    </span>
                                                    {copiedId === user.uniqueId ? (
                                                        <Check size={14} className="text-green-400" />
                                                    ) : (
                                                        <Copy size={14} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-slate-500 text-sm italic">No ID</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{user.email}</td>
                                        <td className="px-6 py-4 text-slate-300">{user.phone || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Timer size={16} className={isExpired ? "text-red-500" : "text-cyan-500"} />
                                                <span className={`font-mono text-sm font-semibold ${isExpired ? 'text-red-400' : 'text-cyan-400'}`}>
                                                    {formatTimerTime(remainingTime)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-slate-500" />
                                                <span className="font-mono text-sm text-green-400 font-semibold">
                                                    {formatTime(user.totalActiveSeconds || 0)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <Calendar size={16} className="text-slate-500" />
                                                <span>{formatDate(user.lastSeen)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSetPassword(user)}
                                                    disabled={setPasswordLoading === user.userId}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Yangi parol o'rnatish"
                                                >
                                                    {setPasswordLoading === user.userId ? (
                                                        <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Key size={18} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    disabled={resetLoading === user.userId}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Parolni tiklash (Email yuborish)"
                                                >
                                                    {resetLoading === user.userId ? (
                                                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Lock size={18} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleShowProgress(user)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors"
                                                    title="Natijalarni ko'rish"
                                                >
                                                    <BarChart2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleAddTime(user)}
                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Vaqt Qo'shish
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Users size={48} className="mx-auto mb-4 text-slate-600" />
                        <p>Hozircha foydalanuvchilar mavjud emas</p>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-purple-400" size={24} />
                        <span className="text-slate-400 text-sm font-medium">Jami Foydalanuvchilar</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{users.length}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-cyan-400" size={24} />
                        <span className="text-slate-400 text-sm font-medium">Jami Faol Vaqt</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatTime(users.reduce((sum, user) => sum + (user.totalActiveSeconds || 0), 0))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-green-400" size={24} />
                        <span className="text-slate-400 text-sm font-medium">Adminlar</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {users.filter(u => u.role === 'admin').length}
                    </div>
                </div>
            </div>

            {showModal && selectedUser && (
                <AddTimeModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                />
            )}

            {progressUser && (
                <UserProgressModal
                    user={progressUser}
                    onClose={() => setProgressUser(null)}
                />
            )}
        </div>
    );
}
