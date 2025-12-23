'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayCircle, CheckCircle, Users, Award } from 'lucide-react';

export default function LandingStats() {
    const [stats, setStats] = useState({
        videos: 0,
        questions: 0,
        users: 0,
        certificates: 0,
        loading: true
    });

    useEffect(() => {
        let unsubscribeUsers: (() => void) | undefined;
        let unsubscribeCerts: (() => void) | undefined;

        const fetchStats = async () => {
            try {
                // Real-time listener for users
                unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
                    setStats(prev => ({
                        ...prev,
                        users: snapshot.size
                    }));
                });

                // Real-time listener for certificates
                unsubscribeCerts = onSnapshot(collection(db, 'certificates'), (snapshot) => {
                    setStats(prev => ({
                        ...prev,
                        certificates: snapshot.size
                    }));
                });

                // Count videos (stages with videoUrl)
                const stagesSnapshot = await getDocs(collection(db, 'testStages'));
                const videoCount = stagesSnapshot.docs.filter(doc => doc.data().videoUrl).length;

                // Count all questions from test stages
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
                    const levelsSnapshot = await getDocs(
                        collection(db, 'quickTests', quickTestDoc.id, 'levels')
                    );
                    levelsSnapshot.docs.forEach(levelDoc => {
                        const levelData = levelDoc.data();
                        if (Array.isArray(levelData.questions)) {
                            questionCount += levelData.questions.length;
                        }
                    });
                }

                setStats(prev => ({
                    ...prev,
                    videos: videoCount,
                    questions: questionCount,
                    loading: false
                }));
            } catch (error) {
                console.error('Error fetching stats:', error);
                // Fallback to some default numbers if error
                setStats({
                    videos: 50,
                    questions: 1000,
                    users: 500,
                    certificates: 100,
                    loading: false
                });
            }
        };

        fetchStats();

        // Cleanup listeners on unmount
        return () => {
            if (unsubscribeUsers) unsubscribeUsers();
            if (unsubscribeCerts) unsubscribeCerts();
        };
    }, []);

    if (stats.loading) {
        return (
            <div className="mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-16 border-t border-slate-800/50 pt-8 sm:pt-10 w-full animate-pulse px-4 sm:px-0">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="h-6 sm:h-8 w-16 sm:w-24 bg-slate-800 rounded mb-2"></div>
                        <div className="h-3 sm:h-4 w-12 sm:w-16 bg-slate-800 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="mt-12 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8 md:gap-16 border-t border-slate-800/50 pt-8 sm:pt-10 w-full px-2 sm:px-0">
            <div className="flex flex-col items-center group">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 flex items-center gap-1.5 sm:gap-2 transition-transform group-hover:scale-110">
                    <PlayCircle className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> {stats.videos}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-500 uppercase tracking-wider font-medium">Video Darslar</div>
            </div>
            <div className="flex flex-col items-center group">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 flex items-center gap-1.5 sm:gap-2 transition-transform group-hover:scale-110">
                    <CheckCircle className="text-green-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> {stats.questions}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-500 uppercase tracking-wider font-medium">Test Savollari</div>
            </div>
            <div className="flex flex-col items-center group">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 flex items-center gap-1.5 sm:gap-2 transition-transform group-hover:scale-110">
                    <Users className="text-purple-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> {stats.users}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-500 uppercase tracking-wider font-medium">O'quvchilar</div>
            </div>
            <div className="flex flex-col items-center group">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 flex items-center gap-1.5 sm:gap-2 transition-transform group-hover:scale-110">
                    <Award className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> {stats.certificates}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-500 uppercase tracking-wider font-medium">Sertifikatlar</div>
            </div>
        </div>
    );
}
