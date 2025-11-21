'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, TestStage } from '@/lib/schema';
import { X, CheckCircle, XCircle, Lock, Video, Clock } from 'lucide-react';

interface UserProgressModalProps {
    user: User;
    onClose: () => void;
}

interface StageWithUserProgress extends TestStage {
    id: string;
    userStatus: {
        isUnlocked: boolean;
        isCompleted: boolean;
        videoCompleted: boolean;
        correctCount: number;
        wrongCount: number;
        score: number;
        lastAttempt?: string;
    };
}

export default function UserProgressModal({ user, onClose }: UserProgressModalProps) {
    const [loading, setLoading] = useState(true);
    const [stages, setStages] = useState<StageWithUserProgress[]>([]);
    const [stats, setStats] = useState({
        totalCorrect: 0,
        totalWrong: 0,
        completedStages: 0
    });
    const [timerData, setTimerData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch all stages
                const stagesRef = collection(db, 'testStages');
                const q = query(stagesRef, orderBy('stageNumber'));
                const stagesSnap = await getDocs(q);

                // 2. Fetch user progress
                const progressRef = doc(db, 'userProgress', user.userId);
                const progressSnap = await getDoc(progressRef);
                const progressData = progressSnap.exists() ? progressSnap.data() : null;

                const completedStageIds = progressData?.completedStages || [];

                // 3. Merge data
                const mergedStages: StageWithUserProgress[] = stagesSnap.docs.map((docSnap, index) => {
                    const stageData = docSnap.data() as TestStage;
                    const stageProgress = progressData?.perStage?.[docSnap.id];

                    const isUnlocked = index === 0 || completedStageIds.includes(stagesSnap.docs[index - 1].id);
                    const isCompleted = stageProgress?.completed || false;
                    const videoCompleted = stageProgress?.videoCompleted || false;
                    const correctCount = stageProgress?.correctCount || 0;
                    const wrongCount = stageProgress?.wrongCount || 0;

                    let score = 0;
                    if (correctCount + wrongCount > 0) {
                        score = Math.round((correctCount / (correctCount + wrongCount)) * 100);
                    }

                    return {
                        id: docSnap.id,
                        ...stageData,
                        userStatus: {
                            isUnlocked,
                            isCompleted,
                            videoCompleted,
                            correctCount,
                            wrongCount,
                            score,
                            lastAttempt: stageProgress?.lastAttempt
                        }
                    };
                });

                setStages(mergedStages);
                setStats({
                    totalCorrect: progressData?.totalCorrect || 0,
                    totalWrong: progressData?.totalWrong || 0,
                    completedStages: completedStageIds.length
                });

                // 4. Fetch timer data
                const timerRef = doc(db, 'userTimers', user.userId);
                const timerSnap = await getDoc(timerRef);
                if (timerSnap.exists()) {
                    setTimerData(timerSnap.data());
                }

            } catch (error) {
                console.error('Error fetching user progress:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.userId]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            {user.name} - Natijalar
                        </h2>
                        <p className="text-slate-400 mt-1 ml-14 text-sm">
                            {user.email}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <div className="text-slate-400 text-sm mb-1">Tugatilgan Bosqichlar</div>
                                    <div className="text-2xl font-bold text-white">
                                        {stats.completedStages} / {stages.length}
                                    </div>
                                </div>
                                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                    <div className="text-blue-400 text-sm mb-1">Platformada</div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {Math.floor((user.totalActiveSeconds || 0) / 3600)}s {Math.floor(((user.totalActiveSeconds || 0) % 3600) / 60)}d
                                    </div>
                                </div>
                                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                                    <div className="text-green-400 text-sm mb-1">Jami To'g'ri</div>
                                    <div className="text-2xl font-bold text-green-400">{stats.totalCorrect}</div>
                                </div>
                                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                                    <div className="text-red-400 text-sm mb-1">Jami Noto'g'ri</div>
                                    <div className="text-2xl font-bold text-red-400">{stats.totalWrong}</div>
                                </div>
                            </div>

                            {/* Timer History */}
                            {timerData && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Clock size={20} className="text-cyan-400" />
                                        Timer Ma'lumotlari
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Current Timer */}
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                                            <span className="text-slate-400">Qolgan vaqt:</span>
                                            <span className="text-2xl font-bold text-cyan-400 font-mono">
                                                {Math.floor(timerData.remainingTime / 3600)}:{String(Math.floor((timerData.remainingTime % 3600) / 60)).padStart(2, '0')}:{String(timerData.remainingTime % 60).padStart(2, '0')}
                                            </span>
                                        </div>

                                        {/* Timer History */}
                                        {timerData.history && timerData.history.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-300 mb-3">Tarix:</h4>
                                                <div className="space-y-2">
                                                    {timerData.history.map((event: any, index: number) => (
                                                        <div key={index} className="flex items-start gap-3 text-sm bg-slate-900/50 rounded-lg p-3">
                                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${event.type === 'init' ? 'bg-green-400' :
                                                                    event.type === 'admin_add' ? 'bg-purple-400' :
                                                                        'bg-blue-400'
                                                                }`} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-white font-medium">
                                                                        {event.type === 'init' ? '🎉 Ro\'yxatdan o\'tish' :
                                                                            event.type === 'admin_add' ? '⚡ Admin tomonidan qo\'shildi' :
                                                                                '💰 To\'lov'}
                                                                    </span>
                                                                    <span className="text-cyan-400 font-mono font-bold">
                                                                        +{Math.floor(event.seconds / 60)} daqiqa
                                                                    </span>
                                                                </div>
                                                                <div className="text-slate-400 text-xs">
                                                                    {event.reason}
                                                                </div>
                                                                <div className="text-slate-500 text-xs mt-1">
                                                                    {event.at?.toDate ? event.at.toDate().toLocaleString('uz-UZ') : 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stages List */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Bosqichlar bo'yicha batafsil</h3>
                                <div className="space-y-4">
                                    {stages.map((stage) => (
                                        <div
                                            key={stage.id}
                                            className={`border rounded-xl p-4 transition-all ${stage.userStatus.isCompleted
                                                ? 'bg-slate-800/40 border-slate-700'
                                                : stage.userStatus.isUnlocked
                                                    ? 'bg-slate-800/20 border-slate-800'
                                                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                {/* Stage Info */}
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 ${stage.userStatus.isCompleted
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : stage.userStatus.isUnlocked
                                                            ? 'bg-purple-500/20 text-purple-400'
                                                            : 'bg-slate-800 text-slate-600'
                                                        }`}>
                                                        {stage.stageNumber}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white flex items-center gap-2">
                                                            {stage.title}
                                                            {stage.userStatus.isCompleted && <CheckCircle size={16} className="text-green-500" />}
                                                            {!stage.userStatus.isUnlocked && <Lock size={16} className="text-slate-600" />}
                                                        </h4>
                                                        <p className="text-sm text-slate-400 line-clamp-1">{stage.description}</p>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-6 text-sm">
                                                    {/* Video Status */}
                                                    {stage.videoUrl && (
                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${stage.userStatus.videoCompleted
                                                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                                            : 'bg-slate-800 border-slate-700 text-slate-500'
                                                            }`}>
                                                            <Video size={16} />
                                                            <span>{stage.userStatus.videoCompleted ? "Ko'rilgan" : "Ko'rilmagan"}</span>
                                                        </div>
                                                    )}

                                                    {/* Test Stats */}
                                                    {(stage.userStatus.correctCount > 0 || stage.userStatus.wrongCount > 0) ? (
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-green-400 flex items-center gap-1">
                                                                <CheckCircle size={16} />
                                                                <span className="font-bold">{stage.userStatus.correctCount}</span>
                                                            </div>
                                                            <div className="text-red-400 flex items-center gap-1">
                                                                <XCircle size={16} />
                                                                <span className="font-bold">{stage.userStatus.wrongCount}</span>
                                                            </div>
                                                            <div className="px-2 py-1 bg-slate-800 rounded text-white font-mono">
                                                                {stage.userStatus.score}%
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-500 italic">Test yechilmagan</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
