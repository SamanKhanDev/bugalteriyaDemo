'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, collectionGroup, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayCircle, CheckCircle, Users, Award } from 'lucide-react';

export default function LandingStats() {
    const [stats, setStats] = useState({
        videos: 0,
        questions: 0,
        users: 0,
        loading: true
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Count Users
                const usersColl = collection(db, 'users');
                const usersSnapshot = await getCountFromServer(usersColl);
                const usersCount = usersSnapshot.data().count;

                // 2. Count Video Lessons (Stages with videoUrl)
                // Note: We can't easily filter by field existence with getCountFromServer without an index sometimes,
                // but let's try simple count of all stages first as most have videos.
                // Or better, just count all stages.
                const stagesColl = collection(db, 'testStages');
                const stagesSnapshot = await getCountFromServer(stagesColl);
                const stagesCount = stagesSnapshot.data().count;

                // 3. Count Questions (using collectionGroup)
                const questionsQuery = query(collectionGroup(db, 'questions'));
                const questionsSnapshot = await getCountFromServer(questionsQuery);
                const questionsCount = questionsSnapshot.data().count;

                setStats({
                    videos: stagesCount,
                    questions: questionsCount,
                    users: usersCount,
                    loading: false
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
                // Fallback to some default numbers if error
                setStats({
                    videos: 50,
                    questions: 1000,
                    users: 500,
                    loading: false
                });
            }
        };

        fetchStats();
    }, []);

    if (stats.loading) {
        return (
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-slate-800/50 pt-10 w-full animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="h-8 w-24 bg-slate-800 rounded mb-2"></div>
                        <div className="h-4 w-16 bg-slate-800 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-slate-800/50 pt-10 w-full">
            <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    <PlayCircle className="text-cyan-400" size={24} /> {stats.videos}+
                </div>
                <div className="text-sm text-slate-500">Video Darslar</div>
            </div>
            <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={24} /> {stats.questions}+
                </div>
                <div className="text-sm text-slate-500">Test Savollari</div>
            </div>
            <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    <Users className="text-purple-400" size={24} /> {stats.users}+
                </div>
                <div className="text-sm text-slate-500">O'quvchilar</div>
            </div>
            <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    <Award className="text-yellow-400" size={24} /> 24/7
                </div>
                <div className="text-sm text-slate-500">Qo'llab-quvvatlash</div>
            </div>
        </div>
    );
}
