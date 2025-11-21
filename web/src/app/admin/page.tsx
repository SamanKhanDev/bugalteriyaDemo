'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminOverviewPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0, // Placeholder logic
        totalRevenue: 0 // Placeholder
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const usersColl = collection(db, 'users');
                const snapshot = await getCountFromServer(usersColl);

                setStats(prev => ({
                    ...prev,
                    totalUsers: snapshot.data().count
                }));
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI Card 1 */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <div className="text-slate-400 text-sm font-medium mb-1">Total Users</div>
                    <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
                    <div className="text-green-400 text-sm mt-2 flex items-center gap-1">
                        <span>+12%</span>
                        <span className="text-slate-500">from last month</span>
                    </div>
                </div>

                {/* KPI Card 2 */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <div className="text-slate-400 text-sm font-medium mb-1">Active Now</div>
                    <div className="text-4xl font-bold text-white">3</div>
                    <div className="text-slate-500 text-sm mt-2">
                        Real-time metric
                    </div>
                </div>

                {/* KPI Card 3 */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <div className="text-slate-400 text-sm font-medium mb-1">Revenue</div>
                    <div className="text-4xl font-bold text-white">$1,240</div>
                    <div className="text-green-400 text-sm mt-2 flex items-center gap-1">
                        <span>+8%</span>
                        <span className="text-slate-500">from last month</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                <div className="text-slate-400 text-sm">
                    No recent activity to show.
                </div>
            </div>
        </div>
    );
}
