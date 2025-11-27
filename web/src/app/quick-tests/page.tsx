'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { QuickTest } from '@/lib/schema';
import { Zap, Clock, Layers, Trophy, ArrowRight, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Navbar } from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';

export default function UserQuickTestsPage() {
    const { user } = useStore();
    const router = useRouter();
    const [tests, setTests] = useState<QuickTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTests();
    }, []);

    const loadTests = async () => {
        try {
            const q = query(
                collection(db, 'quickTests'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const testsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                testId: doc.id
            })) as QuickTest[];

            // Filter client-side to handle missing isActive field (treat as true if missing)
            // and avoid index issues
            const activeTests = testsData.filter(t => t.isActive !== false);
            setTests(activeTests);
        } catch (error) {
            console.error('Error loading tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {user && (
                <Navbar
                    userId={user.userId}
                    userName={user.name}
                    uniqueId={user.uniqueId}
                    onLogout={handleLogout}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-12 pt-24">
                {/* Header */}
                <div className="text-center mb-12 relative">
                    <Link
                        href="/dashboard"
                        className="absolute left-0 top-0 hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Dashboard</span>
                    </Link>

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-4">
                        <Zap size={16} />
                        Tezkor Imtihonlar
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Bilimingizni Sinab Ko'ring
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Bosqichma-bosqich imtihonlar orqali o'z bilimingizni tekshiring va reytingda yuqori o'rinlarni egallang
                    </p>
                </div>

                {/* Tests Grid */}
                {tests.length === 0 ? (
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Zap className="text-slate-600" size={40} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Hozircha imtihonlar yo'q</h3>
                        <p className="text-slate-400">Tez orada yangi imtihonlar qo'shiladi</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tests.map((test) => (
                            <Link
                                key={test.testId}
                                href={`/quick-tests/${test.testId}`}
                                className="group bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Zap className="text-white" size={32} />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                    {test.title}
                                </h3>

                                {/* Description */}
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                    {test.description || 'Bilimingizni sinab ko\'ring'}
                                </p>

                                {/* Info */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Layers size={16} className="text-cyan-400" />
                                        <span>{test.totalLevels} bosqich</span>
                                    </div>
                                    {test.timeLimit && (
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Clock size={16} className="text-blue-400" />
                                            <span>{Math.floor(test.timeLimit / 60)} daq</span>
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                    <span className="text-cyan-400 font-medium group-hover:text-cyan-300 transition-colors">
                                        Boshlash
                                    </span>
                                    <ArrowRight className="text-cyan-400 group-hover:translate-x-1 transition-transform" size={20} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Leaderboard CTA */}
                {tests.length > 0 && (
                    <div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-8 text-center">
                        <Trophy className="text-cyan-400 mx-auto mb-4" size={48} />
                        <h3 className="text-2xl font-bold text-white mb-2">Reytingni Ko'ring</h3>
                        <p className="text-slate-400 mb-6">
                            Eng yaxshi natijalar va o'z o'rningizni aniqlang
                        </p>
                        <Link
                            href="/quick-tests/leaderboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                        >
                            <Trophy size={20} />
                            Reytingni Ko'rish
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
