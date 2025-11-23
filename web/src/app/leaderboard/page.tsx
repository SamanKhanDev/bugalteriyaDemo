'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Trophy, Star, Medal, TrendingUp, Award, Search } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import ActivityTracker from '@/components/layout/ActivityTracker';

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

export default function LeaderboardPage() {
    const { user, isLoadingAuth } = useStore();
    const router = useRouter();
    const [rankings, setRankings] = useState<UserRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalStages, setTotalStages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isLoadingAuth && !user) {
            router.push('/auth/login');
        } else if (user) {
            fetchLeaderboard();
        }
    }, [user, isLoadingAuth, router]);

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

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading || isLoadingAuth || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar userId={user.userId} userName={user.name} onLogout={handleLogout} />
            <ActivityTracker />

            <div className="min-h-screen bg-slate-950 text-white pt-20 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Trophy className="text-yellow-400" size={48} />
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                Reyting Jadvali
                            </h1>
                        </div>
                        <p className="text-slate-400 text-lg">
                            Eng ko'p yulduz to'plagan foydalanuvchilar
                        </p>
                    </div>

                    {/* Top 3 Podium */}
                    {rankings.length >= 3 && (
                        <div className="grid grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
                            {/* 2nd Place */}
                            <div className="flex flex-col items-center pt-12">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-400 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-gray-500">
                                        {rankings[1].name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1">
                                        <Medal className="text-gray-400" size={20} />
                                    </div>
                                </div>
                                <h3 className="font-semibold text-white mt-3 text-center">{rankings[1].name}</h3>
                                <div className="flex items-center gap-1 text-yellow-400 mt-2">
                                    <Star size={16} fill="currentColor" />
                                    <span className="font-bold">{rankings[1].totalStars}</span>
                                </div>
                                <div className="bg-gradient-to-br from-gray-600 to-gray-400 rounded-t-xl px-6 py-4 mt-4 w-full text-center">
                                    <div className="text-3xl font-bold">2</div>
                                </div>
                            </div>

                            {/* 1st Place */}
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-yellow-500 shadow-lg shadow-yellow-500/50">
                                        {rankings[0].name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -top-3 -right-3 bg-slate-900 rounded-full p-1">
                                        <Trophy className="text-yellow-400" size={24} />
                                    </div>
                                </div>
                                <h3 className="font-bold text-white mt-3 text-center text-lg">{rankings[0].name}</h3>
                                <div className="flex items-center gap-1 text-yellow-400 mt-2">
                                    <Star size={18} fill="currentColor" />
                                    <span className="font-bold text-lg">{rankings[0].totalStars}</span>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-600 to-yellow-400 rounded-t-xl px-6 py-6 mt-4 w-full text-center shadow-lg shadow-yellow-500/30">
                                    <div className="text-4xl font-bold">1</div>
                                </div>
                            </div>

                            {/* 3rd Place */}
                            <div className="flex flex-col items-center pt-16">
                                <div className="relative">
                                    <div className="w-18 h-18 bg-gradient-to-br from-orange-600 to-orange-400 rounded-full flex items-center justify-center text-xl font-bold border-4 border-orange-500">
                                        {rankings[2].name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1">
                                        <Medal className="text-orange-600" size={20} />
                                    </div>
                                </div>
                                <h3 className="font-semibold text-white mt-3 text-center">{rankings[2].name}</h3>
                                <div className="flex items-center gap-1 text-yellow-400 mt-2">
                                    <Star size={16} fill="currentColor" />
                                    <span className="font-bold">{rankings[2].totalStars}</span>
                                </div>
                                <div className="bg-gradient-to-br from-orange-600 to-orange-400 rounded-t-xl px-6 py-3 mt-4 w-full text-center">
                                    <div className="text-2xl font-bold">3</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ism yoki email bo'yicha qidirish..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>
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
                                    {rankings
                                        .filter(rankUser =>
                                            rankUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            rankUser.email.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .map((rankUser) => (
                                            <tr key={rankUser.userId} className={`hover:bg-slate-800/30 transition-colors ${rankUser.userId === user.userId ? 'bg-cyan-500/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {getRankBadge(rankUser.rank)}
                                                        <span className={`text-lg font-bold ${rankUser.rank <= 3 ? 'text-white' : 'text-slate-400'}`}>
                                                            #{rankUser.rank}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 bg-gradient-to-br ${getRankColor(rankUser.rank)} rounded-full flex items-center justify-center text-white font-semibold`}>
                                                            {rankUser.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white flex items-center gap-2">
                                                                {rankUser.name}
                                                                {rankUser.userId === user.userId && (
                                                                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">Siz</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{rankUser.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Star className="text-yellow-400" size={18} fill="currentColor" />
                                                        <span className="text-xl font-bold text-yellow-400">{rankUser.totalStars}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-center">
                                                        <span className="text-white font-semibold">{rankUser.completedStages}</span>
                                                        <span className="text-slate-500"> / {rankUser.totalStages}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className={`px-3 py-1 rounded-full font-semibold ${rankUser.averageScore >= 90 ? 'bg-green-500/20 text-green-400' :
                                                            rankUser.averageScore >= 75 ? 'bg-blue-500/20 text-blue-400' :
                                                                rankUser.averageScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {rankUser.averageScore}%
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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
            </div>
        </>
    );
}
