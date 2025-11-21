'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Star, Medal, TrendingUp, Award } from 'lucide-react';

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

export default function AdminLeaderboardPage() {
    const [rankings, setRankings] = useState<UserRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalStages, setTotalStages] = useState(0);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
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
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
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
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Trophy className="text-yellow-400" />
                    Reyting Jadvali
                </h1>
                <p className="text-slate-400">Foydalanuvchilar reytingi (yulduzlar bo'yicha)</p>
            </div>

            {/* Full Rankings Table */}
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
                            {rankings.map((user) => (
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-cyan-400" size={24} />
                        <span className="text-slate-400 text-sm font-medium">Jami Ishtirokchilar</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{rankings.length}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Star className="text-yellow-400" size={24} />
                        <span className="text-slate-400 text-sm font-medium">Jami Yulduzlar</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">
                        {rankings.reduce((sum, user) => sum + user.totalStars, 0)}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="text-purple-400" size={24} />
                        <span className="text-slate-400 text-sm font-medium">O'rtacha Ball</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">
                        {rankings.length > 0
                            ? Math.round(rankings.reduce((sum, user) => sum + user.averageScore, 0) / rankings.length)
                            : 0}%
                    </div>
                </div>
            </div>
        </div>
    );
}
