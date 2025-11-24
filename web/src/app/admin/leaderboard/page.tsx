'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Star, Medal, TrendingUp, Award, Search, Zap, Clock, CheckCircle2, Eye } from 'lucide-react';
import Link from 'next/link';

interface UserRanking {
    userId: string;
    name: string;
    email: string;
    totalStars: number;
    completedStages: number;
    totalStages: number;
    averageScore: number;
    rank: number;
}

interface QuickTestResultDisplay {
    id: string;
    userId: string;
    userName: string;
    testId: string;
    testTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    timeSpentSeconds: number;
    completedAt: any;
    isGuest: boolean;
}

export default function AdminLeaderboardPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'quick-tests'>('general');

    // General Leaderboard State
    const [rankings, setRankings] = useState<UserRanking[]>([]);
    const [totalStages, setTotalStages] = useState(0);

    // Quick Tests Leaderboard State
    const [quickTestResults, setQuickTestResults] = useState<QuickTestResultDisplay[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (activeTab === 'general') {
            fetchGeneralLeaderboard();
        } else {
            fetchQuickTestLeaderboard();
        }
    }, [activeTab]);

    const fetchGeneralLeaderboard = async () => {
        try {
            // 1. Get total stages count
            const stagesSnap = await getDocs(collection(db, 'testStages'));
            const stagesCount = stagesSnap.size;
            setTotalStages(stagesCount);

            // 2. Get all users
            const usersSnap = await getDocs(collection(db, 'users'));

            // 3. Get progress for each user
            const userRankings: UserRanking[] = [];

            for (const userDoc of usersSnap.docs) {
                const userData = userDoc.data();

                // Skip admins
                if (userData.role === 'admin') continue;

                // Get user progress
                const progressRef = doc(db, 'userProgress', userDoc.id);
                const progressSnap = await getDoc(progressRef);

                if (progressSnap.exists()) {
                    const progressData = progressSnap.data();
                    const totalCorrect = progressData.totalCorrect || 0;
                    const totalWrong = progressData.totalWrong || 0;
                    const completedStages = progressData.completedStages?.length || 0;

                    const totalQuestions = totalCorrect + totalWrong;
                    const averageScore = totalQuestions > 0
                        ? Math.round((totalCorrect / totalQuestions) * 100)
                        : 0;

                    userRankings.push({
                        userId: userDoc.id,
                        name: userData.name,
                        email: userData.email,
                        totalStars: totalCorrect,
                        completedStages,
                        totalStages: stagesCount,
                        averageScore,
                        rank: 0
                    });
                }
            }

            // 4. Sort by total stars (descending)
            userRankings.sort((a, b) => b.totalStars - a.totalStars);

            // 5. Assign ranks
            userRankings.forEach((user, index) => {
                user.rank = index + 1;
            });

            setRankings(userRankings);
        } catch (error) {
            console.error('Error fetching general leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuickTestLeaderboard = async () => {
        setLoading(true);
        try {
            // 1. Get all quick test results
            const resultsSnap = await getDocs(query(collection(db, 'quickTestResults'), orderBy('completedAt', 'desc'), limit(100)));

            // 2. Get all tests to map titles
            const testsSnap = await getDocs(collection(db, 'quickTests'));
            const testMap = new Map();
            testsSnap.docs.forEach(doc => {
                testMap.set(doc.id, doc.data().title);
            });

            const results: QuickTestResultDisplay[] = resultsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    userName: data.userName || 'Noma\'lum',
                    testId: data.testId,
                    testTitle: testMap.get(data.testId) || 'O\'chirilgan Test',
                    score: data.score,
                    totalQuestions: data.totalQuestions,
                    percentage: (data.score / data.totalQuestions) * 100,
                    timeSpentSeconds: data.timeSpentSeconds,
                    completedAt: data.completedAt,
                    isGuest: data.isGuest || false
                };
            });

            setQuickTestResults(results);
        } catch (error) {
            console.error('Error fetching quick test leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('uz-UZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Medal className="text-yellow-400" size={24} />;
        if (rank === 2) return <Medal className="text-gray-400" size={24} />;
        if (rank === 3) return <Medal className="text-orange-600" size={24} />;
        return null;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'from-yellow-600 to-yellow-400';
        if (rank === 2) return 'from-gray-600 to-gray-400';
        if (rank === 3) return 'from-orange-600 to-orange-400';
        return 'from-slate-700 to-slate-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Trophy className="text-yellow-400" />
                        Reyting Jadvali
                    </h1>
                    <p className="text-slate-400">Foydalanuvchilar natijalari va statistikasi</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'general'
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Asosiy Kurslar
                    </button>
                    <button
                        onClick={() => setActiveTab('quick-tests')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'quick-tests'
                                ? 'bg-cyan-500/10 text-cyan-400 shadow-lg'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Tezkor Imtihonlar
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ism yoki test bo'yicha qidirish..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'general' ? (
                        /* General Leaderboard Table */
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reyting</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Foydalanuvchi</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Yulduzlar</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Tugatilgan</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">O'rtacha Ball</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {rankings
                                            .filter(user =>
                                                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                user.email.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((user) => (
                                                <tr key={user.userId} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {getRankBadge(user.rank)}
                                                            <span className={`text-lg font-bold ${user.rank <= 3 ? 'text-white' : 'text-slate-400'}`}>
                                                                #{user.rank}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 bg-gradient-to-br ${getRankColor(user.rank)} rounded-full flex items-center justify-center text-white font-semibold`}>
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-white">{user.name}</div>
                                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Star className="text-yellow-400" size={18} fill="currentColor" />
                                                            <span className="text-xl font-bold text-yellow-400">{user.totalStars}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-center">
                                                            <span className="text-white font-semibold">{user.completedStages}</span>
                                                            <span className="text-slate-500"> / {user.totalStages}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`px-3 py-1 rounded-full font-semibold ${user.averageScore >= 90 ? 'bg-green-500/20 text-green-400' :
                                                                user.averageScore >= 75 ? 'bg-blue-500/20 text-blue-400' :
                                                                    user.averageScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                {user.averageScore}%
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            {rankings.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Award size={48} className="mx-auto mb-4 text-slate-600" />
                                    <p>Hozircha reyting ma'lumotlari yo'q</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Quick Tests Leaderboard Table */
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Foydalanuvchi</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Test</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Natija</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Vaqt</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Sana</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {quickTestResults
                                            .filter(result =>
                                                result.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                result.testTitle.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((result) => (
                                                <tr key={result.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${result.isGuest ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'
                                                                }`}>
                                                                {result.userName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-white flex items-center gap-2">
                                                                    {result.userName}
                                                                    {result.isGuest && <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-full">Mehmon</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-white font-medium">{result.testTitle}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-lg font-bold ${result.percentage >= 80 ? 'text-green-400' :
                                                                    result.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                                                                }`}>
                                                                {result.percentage.toFixed(0)}%
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {result.score}/{result.totalQuestions}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2 text-slate-300">
                                                            <Clock size={16} className="text-blue-400" />
                                                            <span className="font-mono">{formatTime(result.timeSpentSeconds)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-slate-400 text-sm">
                                                        {formatDate(result.completedAt)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            href={`/admin/quick-tests/${result.testId}/results`}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Eye size={16} />
                                                            Javoblar
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            {quickTestResults.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Zap size={48} className="mx-auto mb-4 text-slate-600" />
                                    <p>Hozircha tezkor imtihon natijalari yo'q</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
