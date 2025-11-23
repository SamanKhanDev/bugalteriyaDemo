'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickTestResult } from '@/lib/schema';
import { Trophy, Medal, Award, Clock, Target, TrendingUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

interface LeaderboardEntry {
    userId: string;
    userName: string;
    totalScore: number;
    totalQuestions: number;
    bestTime: number;
    testsCompleted: number;
    percentage: number;
}

export default function QuickTestLeaderboardPage() {
    const { user } = useStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState<number | null>(null);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const resultsSnapshot = await getDocs(
                query(collection(db, 'quickTestResults'), orderBy('completedAt', 'desc'))
            );

            const results = resultsSnapshot.docs.map(doc => doc.data()) as QuickTestResult[];

            // Group by user
            const userMap = new Map<string, LeaderboardEntry>();

            results.forEach(result => {
                const existing = userMap.get(result.userId);
                if (existing) {
                    existing.totalScore += result.score;
                    existing.totalQuestions += result.totalQuestions;
                    existing.bestTime = Math.min(existing.bestTime, result.timeSpentSeconds);
                    if (result.levelNumber === 1) {
                        existing.testsCompleted += 1;
                    }
                } else {
                    userMap.set(result.userId, {
                        userId: result.userId,
                        userName: result.userName,
                        totalScore: result.score,
                        totalQuestions: result.totalQuestions,
                        bestTime: result.timeSpentSeconds,
                        testsCompleted: result.levelNumber === 1 ? 1 : 0,
                        percentage: 0
                    });
                }
            });

            // Calculate percentages and sort
            const entries = Array.from(userMap.values()).map(entry => ({
                ...entry,
                percentage: (entry.totalScore / entry.totalQuestions) * 100
            })).sort((a, b) => {
                // Sort by percentage first, then by best time
                if (b.percentage !== a.percentage) {
                    return b.percentage - a.percentage;
                }
                return a.bestTime - b.bestTime;
            });

            setLeaderboard(entries);

            // Find user rank
            if (user) {
                const rank = entries.findIndex(e => e.userId === user.userId);
                setUserRank(rank !== -1 ? rank + 1 : null);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="text-yellow-400" size={24} />;
        if (index === 1) return <Medal className="text-slate-300" size={24} />;
        if (index === 2) return <Award className="text-orange-400" size={24} />;
        return null;
    };

    const getRankBadge = (index: number) => {
        if (index === 0) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
        if (index === 1) return 'bg-gradient-to-r from-slate-400 to-slate-500';
        if (index === 2) return 'bg-gradient-to-r from-orange-500 to-red-500';
        return 'bg-slate-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium mb-4">
                        <Trophy size={16} />
                        Reyting Jadvali
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Eng Yaxshi Natijalar
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Tezkor imtihonlarda eng yuqori natijalarni ko'rsatgan foydalanuvchilar
                    </p>
                </div>

                {/* User's Rank Card */}
                {user && userRank && (
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                    <TrendingUp className="text-cyan-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Sizning o'rningiz</p>
                                    <p className="text-2xl font-bold text-white">#{userRank}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-400">Umumiy ball</p>
                                <p className="text-2xl font-bold text-cyan-400">
                                    {leaderboard[userRank - 1]?.percentage.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                    <div className="grid grid-cols-3 gap-4 mb-12">
                        {/* 2nd Place */}
                        <div className="pt-12">
                            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-6 text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Medal className="text-white" size={32} />
                                </div>
                                <div className="text-4xl font-bold text-slate-300 mb-2">2</div>
                                <h3 className="font-semibold text-white mb-2">{leaderboard[1].userName}</h3>
                                <div className="text-2xl font-bold text-slate-300 mb-1">
                                    {leaderboard[1].percentage.toFixed(0)}%
                                </div>
                                <p className="text-sm text-slate-500">
                                    {leaderboard[1].totalScore}/{leaderboard[1].totalQuestions}
                                </p>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div>
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-3xl p-6 text-center relative">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                                        <Trophy className="text-white" size={24} />
                                    </div>
                                </div>
                                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 mt-6">
                                    <Trophy className="text-white" size={40} />
                                </div>
                                <div className="text-5xl font-bold text-yellow-400 mb-2">1</div>
                                <h3 className="font-bold text-white text-lg mb-2">{leaderboard[0].userName}</h3>
                                <div className="text-3xl font-bold text-yellow-400 mb-1">
                                    {leaderboard[0].percentage.toFixed(0)}%
                                </div>
                                <p className="text-sm text-slate-400">
                                    {leaderboard[0].totalScore}/{leaderboard[0].totalQuestions}
                                </p>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="pt-12">
                            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-6 text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Award className="text-white" size={32} />
                                </div>
                                <div className="text-4xl font-bold text-orange-400 mb-2">3</div>
                                <h3 className="font-semibold text-white mb-2">{leaderboard[2].userName}</h3>
                                <div className="text-2xl font-bold text-orange-400 mb-1">
                                    {leaderboard[2].percentage.toFixed(0)}%
                                </div>
                                <p className="text-sm text-slate-500">
                                    {leaderboard[2].totalScore}/{leaderboard[2].totalQuestions}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Leaderboard */}
                <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                        <h2 className="text-xl font-bold text-white">Barcha Ishtirokchilar</h2>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            Hali natijalar yo'q
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={entry.userId}
                                    className={`p-6 hover:bg-slate-800/50 transition-colors ${user?.userId === entry.userId ? 'bg-cyan-500/5 border-l-4 border-cyan-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Rank */}
                                        <div className={`w-12 h-12 ${getRankBadge(index)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                            {getRankIcon(index) || (
                                                <span className="text-lg font-bold text-white">#{index + 1}</span>
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white truncate">
                                                {entry.userName}
                                                {user?.userId === entry.userId && (
                                                    <span className="ml-2 text-xs text-cyan-400">(Siz)</span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                {entry.testsCompleted} ta test topshirgan
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Target className="text-cyan-400" size={16} />
                                                    <span className="text-lg font-bold text-white">
                                                        {entry.percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    {entry.totalScore}/{entry.totalQuestions}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock className="text-blue-400" size={16} />
                                                    <span className="text-sm font-mono text-white">
                                                        {formatTime(entry.bestTime)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400">Eng tez vaqt</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-8 text-center">
                    <Link
                        href="/quick-tests"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                    >
                        <Trophy size={20} />
                        Imtihonlarga Qaytish
                    </Link>
                </div>
            </div>
        </div>
    );
}
