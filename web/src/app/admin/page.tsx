'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayCircle, CheckCircle, Users, Award } from 'lucide-react';

interface Stats {
    totalVideos: number;
    totalQuestions: number;
    totalUsers: number;
    totalCertificates: number;
    loading: boolean;
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<Stats>({
        totalVideos: 0,
        totalQuestions: 0,
        totalUsers: 0,
        totalCertificates: 0,
        loading: true
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Real-time listener for users
                const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
                    setStats(prev => ({
                        ...prev,
                        totalUsers: snapshot.size
                    }));
                });

                // Real-time listener for certificates
                const certsUnsubscribe = onSnapshot(collection(db, 'certificates'), (snapshot) => {
                    setStats(prev => ({
                        ...prev,
                        totalCertificates: snapshot.size
                    }));
                });

                // Count videos (stages with videoUrl)
                const stagesSnapshot = await getDocs(collection(db, 'testStages'));
                const videoCount = stagesSnapshot.docs.filter(doc => doc.data().videoUrl).length;

                // Count all questions
                let questionCount = 0;
                for (const stageDoc of stagesSnapshot.docs) {
                    const questionsSnapshot = await getDocs(
                        collection(db, 'testStages', stageDoc.id, 'questions')
                    );
                    questionCount += questionsSnapshot.size;
                }

                // Also count quick test questions
                const quickTestsSnapshot = await getDocs(collection(db, 'quickTests'));
                for (const quickTestDoc of quickTestsSnapshot.docs) {
                    const questionsSnapshot = await getDocs(
                        collection(db, 'quickTests', quickTestDoc.id, 'questions')
                    );
                    questionCount += questionsSnapshot.size;
                }

                setStats(prev => ({
                    ...prev,
                    totalVideos: videoCount,
                    totalQuestions: questionCount,
                    loading: false
                }));

                // Cleanup listeners
                return () => {
                    usersUnsubscribe();
                    certsUnsubscribe();
                };
            } catch (error) {
                console.error('Error fetching stats:', error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Video Darslar',
            value: stats.totalVideos,
            icon: PlayCircle,
            color: 'from-cyan-500 to-blue-600',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20'
        },
        {
            title: 'Test Savollari',
            value: stats.totalQuestions,
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-600',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        {
            title: 'O\'quvchilar',
            value: stats.totalUsers,
            icon: Users,
            color: 'from-purple-500 to-pink-600',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20'
        },
        {
            title: 'Sertifikatlar',
            value: stats.totalCertificates,
            icon: Award,
            color: 'from-yellow-500 to-orange-600',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/20'
        }
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Bosh sahifa</h1>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className={`bg-slate-900 border ${card.borderColor} p-6 rounded-2xl hover:scale-105 transition-transform duration-300`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} size={24} />
                                </div>
                                {stats.loading && (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyan-500"></div>
                                )}
                            </div>
                            <div className="text-slate-400 text-sm font-medium mb-1">{card.title}</div>
                            <div className="text-4xl font-bold text-white">
                                {stats.loading ? '...' : card.value}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Tezkor Harakatlar</h2>
                    <div className="space-y-3">
                        <a
                            href="/admin/users"
                            className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <div className="font-medium text-white">Foydalanuvchilarni boshqarish</div>
                            <div className="text-sm text-slate-400 mt-1">Foydalanuvchilarni ko'rish va tahrirlash</div>
                        </a>
                        <a
                            href="/admin/tests"
                            className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <div className="font-medium text-white">Testlarni boshqarish</div>
                            <div className="text-sm text-slate-400 mt-1">Yangi test qo'shish yoki tahrirlash</div>
                        </a>
                        <a
                            href="/admin/certificates"
                            className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <div className="font-medium text-white">Sertifikatlar</div>
                            <div className="text-sm text-slate-400 mt-1">Berilgan sertifikatlarni ko'rish</div>
                        </a>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Tizim Holati</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Database</span>
                            <span className="flex items-center gap-2 text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                Faol
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Firebase Auth</span>
                            <span className="flex items-center gap-2 text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                Faol
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Storage</span>
                            <span className="flex items-center gap-2 text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                Faol
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
