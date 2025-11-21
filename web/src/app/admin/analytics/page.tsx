'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStages: 0,
        completedTests: 0,
        averageScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnap.size;

                const stagesSnap = await getDocs(collection(db, 'testStages'));
                const totalStages = stagesSnap.size;

                const progressSnap = await getDocs(collection(db, 'userProgress'));
                let totalCompleted = 0;
                let totalCorrect = 0;
                let totalQuestions = 0;

                progressSnap.forEach(doc => {
                    const data = doc.data();
                    totalCompleted += data.completedStages?.length || 0;
                    totalCorrect += data.totalCorrect || 0;
                    totalQuestions += (data.totalCorrect || 0) + (data.totalWrong || 0);
                });

                const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

                setStats({
                    totalUsers,
                    totalStages,
                    completedTests: totalCompleted,
                    averageScore
                });
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const performanceData = [
        { name: 'Bosqich 1', score: 85 },
        { name: 'Bosqich 2', score: 78 },
        { name: 'Bosqich 3', score: 92 },
        { name: 'Bosqich 4', score: 88 },
    ];

    const userActivityData = [
        { name: 'Faol', value: stats.totalUsers * 0.6, color: '#10b981' },
        { name: 'Nofaol', value: stats.totalUsers * 0.4, color: '#6b7280' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Analitika</h1>
                <p className="text-slate-400">Platformaning umumiy statistikasi</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg shadow-purple-900/20">
                    <div className="text-purple-200 text-sm font-medium mb-2">Jami Foydalanuvchilar</div>
                    <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-900/20">
                    <div className="text-blue-200 text-sm font-medium mb-2">Jami Bosqichlar</div>
                    <div className="text-4xl font-bold text-white">{stats.totalStages}</div>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-lg shadow-green-900/20">
                    <div className="text-green-200 text-sm font-medium mb-2">Tugatilgan Testlar</div>
                    <div className="text-4xl font-bold text-white">{stats.completedTests}</div>
                </div>

                <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-6 shadow-lg shadow-cyan-900/20">
                    <div className="text-cyan-200 text-sm font-medium mb-2">O'rtacha Ball</div>
                    <div className="text-4xl font-bold text-white">{stats.averageScore}%</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Bosqichlar bo'yicha natijalar</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="score" fill="#8b5cf6" name="Ball (%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Foydalanuvchilar faolligi</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={userActivityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {userActivityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">So'nggi faoliyat</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-slate-300">Yangi foydalanuvchi ro'yxatdan o'tdi</span>
                        </div>
                        <span className="text-slate-500 text-sm">5 daqiqa oldin</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-300">Test yakunlandi</span>
                        </div>
                        <span className="text-slate-500 text-sm">12 daqiqa oldin</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-slate-300">Video dars ko'rildi</span>
                        </div>
                        <span className="text-slate-500 text-sm">25 daqiqa oldin</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
