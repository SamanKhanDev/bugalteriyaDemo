'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { TestStage } from '@/lib/schema';
import { Clock, Trophy, Target, PlayCircle, FileText, Lock, CheckCircle, Video, Menu, X, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import ActivityTracker from '@/components/layout/ActivityTracker';

interface StageWithProgress extends TestStage {
    id: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    videoCompleted: boolean;
    score?: number;
}

export default function DashboardPage() {
    const { user, isLoadingAuth } = useStore();
    const router = useRouter();
    const [stages, setStages] = useState<StageWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [stats, setStats] = useState({
        completedStages: 0,
        totalStages: 0,
        averageScore: 0,
        remainingTime: 0,
        totalCorrect: 0,
        totalWrong: 0
    });
    const [certificate, setCertificate] = useState<any>(null);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const stagesRef = collection(db, 'testStages');
                const q = query(stagesRef, orderBy('stageNumber'));
                const stagesSnap = await getDocs(q);

                const progressRef = doc(db, 'userProgress', user.userId);
                const progressSnap = await getDoc(progressRef);
                const progressData = progressSnap.exists() ? progressSnap.data() : null;

                const timerRef = doc(db, 'userTimers', user.userId);
                const timerSnap = await getDoc(timerRef);
                const timerData = timerSnap.exists() ? timerSnap.data() : null;

                const completedStageIds = progressData?.completedStages || [];

                const stagesWithProgress: StageWithProgress[] = stagesSnap.docs.map((docSnap, index) => {
                    const stageData = docSnap.data() as TestStage;
                    const stageProgress = progressData?.perStage?.[docSnap.id];

                    const isUnlocked = index === 0 || completedStageIds.includes(stagesSnap.docs[index - 1].id);
                    const isCompleted = stageProgress?.completed || false;
                    const videoCompleted = stageProgress?.videoCompleted || false;

                    let score = 0;
                    if (stageProgress && (stageProgress.correctCount || stageProgress.wrongCount)) {
                        const total = stageProgress.correctCount + stageProgress.wrongCount;
                        score = total > 0 ? Math.round((stageProgress.correctCount / total) * 100) : 0;
                    }

                    return {
                        id: docSnap.id,
                        ...stageData,
                        isUnlocked,
                        isCompleted,
                        videoCompleted,
                        score
                    };
                });

                setStages(stagesWithProgress);

                const totalCorrect = progressData?.totalCorrect || 0;
                const totalWrong = progressData?.totalWrong || 0;
                const totalQuestions = totalCorrect + totalWrong;
                const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

                setStats({
                    completedStages: completedStageIds.length,
                    totalStages: stagesWithProgress.length,
                    averageScore,
                    remainingTime: timerData?.remainingTime || 0,
                    totalCorrect,
                    totalWrong
                });

                // Check if user is eligible for certificate (all stages completed + 85% score)
                const isEligible = completedStageIds.length === stagesWithProgress.length &&
                    stagesWithProgress.length > 0 &&
                    averageScore >= 85;

                console.log('🎓 Certificate Eligibility Check:');
                console.log('  - Completed stages:', completedStageIds.length);
                console.log('  - Total stages:', stagesWithProgress.length);
                console.log('  - Average score:', averageScore + '%');
                console.log('  - Is eligible:', isEligible);

                if (isEligible) {
                    // Check if certificate already exists
                    const certificatesRef = collection(db, 'certificates');
                    const certificatesSnap = await getDocs(certificatesRef);
                    const userCert = certificatesSnap.docs.find(doc => doc.data().userId === user.userId);

                    console.log('  - Certificate exists:', !!userCert);

                    if (userCert) {
                        setCertificate({ id: userCert.id, ...userCert.data() });
                        setShowCertificate(true);
                        console.log('  ✅ Certificate loaded!');
                    } else {
                        console.log('  ⚠️ User is eligible but admin has not issued certificate yet');
                    }
                } else {
                    console.log('  ❌ User is not eligible for certificate');
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!isLoadingAuth && user) {
            fetchData();
        } else if (!isLoadingAuth && !user) {
            router.push('/auth/login');
        }
    }, [user, isLoadingAuth, router]);

    // Real-time certificate listener
    useEffect(() => {
        if (!user) return;

        const certificatesRef = collection(db, 'certificates');
        const unsubscribe = onSnapshot(certificatesRef, (snapshot) => {
            const userCert = snapshot.docs.find(doc => doc.data().userId === user.userId);

            if (userCert) {
                console.log('🎓 Certificate found in real-time!', userCert.id);
                setCertificate({ id: userCert.id, ...userCert.data() });
                setShowCertificate(true);
            } else {
                console.log('⚠️ No certificate found for user');
                setCertificate(null);
                setShowCertificate(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}s ${minutes}d`;
    };

    const getStageAction = (stage: StageWithProgress) => {
        if (!stage.isUnlocked) {
            return {
                text: 'Qulflangan',
                icon: Lock,
                href: '#',
                disabled: true,
                color: 'text-slate-500'
            };
        }

        if (stage.isCompleted) {
            return {
                text: 'Qayta topshirish',
                icon: CheckCircle,
                href: `/stage/${stage.id}`,
                disabled: false,
                color: 'text-green-400'
            };
        }

        if (stage.videoUrl && stage.videoRequiredPercent && !stage.videoCompleted) {
            return {
                text: 'Video ko\'rish',
                icon: Video,
                href: `/stage/${stage.id}/video`,
                disabled: false,
                color: 'text-cyan-400'
            };
        }

        return {
            text: 'Boshlash',
            icon: PlayCircle,
            href: `/stage/${stage.id}`,
            disabled: false,
            color: 'text-purple-400'
        };
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
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar userId={user.userId} userName={user.name} onLogout={handleLogout} />
            <ActivityTracker />

            {/* Progress Menu Button */}
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="fixed top-24 right-4 z-40 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg transition-all"
            >
                {showMenu ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Slide-out Progress Menu */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-30 transform transition-transform duration-300 ${showMenu ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="p-6 pt-24 h-full overflow-y-auto">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Award className="text-purple-400" size={28} />
                        Natijalarim
                    </h2>

                    {/* Overall Stats */}
                    <div className="space-y-4 mb-8">
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-sm">Umum iy Ball</span>
                                <Trophy className="text-yellow-500" size={20} />
                            </div>
                            <div className="text-3xl font-bold text-white">{stats.averageScore}%</div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-sm">Tugatilgan</span>
                                <TrendingUp className="text-green-500" size={20} />
                            </div>
                            <div className="text-3xl font-bold text-white">{stats.completedStages}/{stats.totalStages}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                                <div className="text-green-400 text-xs mb-1">To'g'ri</div>
                                <div className="text-2xl font-bold text-green-400">{stats.totalCorrect}</div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                <div className="text-red-400 text-xs mb-1">Noto'g'ri</div>
                                <div className="text-2xl font-bold text-red-400">{stats.totalWrong}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stage Results */}
                    <h3 className="text-lg font-semibold text-white mb-4">Bosqichlar bo'yicha</h3>
                    <div className="space-y-3">
                        {stages.map((stage) => (
                            <div
                                key={stage.id}
                                className={`p-4 rounded-xl border ${stage.isCompleted
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : stage.isUnlocked
                                        ? 'bg-slate-800/50 border-slate-700'
                                        : 'bg-slate-800/20 border-slate-800 opacity-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${stage.isCompleted
                                            ? 'bg-green-500 text-white'
                                            : stage.isUnlocked
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-slate-700 text-slate-500'
                                            }`}>
                                            {stage.stageNumber}
                                        </div>
                                        <span className="text-white font-medium text-sm">{stage.title}</span>
                                    </div>
                                    {stage.isCompleted && (
                                        <CheckCircle className="text-green-500" size={20} />
                                    )}
                                    {!stage.isUnlocked && (
                                        <Lock className="text-slate-600" size={20} />
                                    )}
                                </div>

                                {stage.isCompleted && stage.score !== undefined && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Ball</span>
                                            <span className="text-green-400 font-semibold">{stage.score}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all"
                                                style={{ width: `${stage.score}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {stage.videoUrl && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                                        <Video size={12} />
                                        <span>Video dars</span>
                                        {stage.videoCompleted && <CheckCircle size={12} className="text-green-500" />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Xush kelibsiz, {user?.name}!
                        </h1>
                        <p className="text-slate-400">O'quv jarayoningizni davom ettiring</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg shadow-purple-900/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Target className="text-purple-200" size={24} />
                                <span className="text-purple-200 text-sm font-medium">Tugatilgan</span>
                            </div>
                            <div className="text-3xl font-bold text-white">
                                {stats.completedStages}/{stats.totalStages}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-6 shadow-lg shadow-cyan-900/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy className="text-cyan-200" size={24} />
                                <span className="text-cyan-200 text-sm font-medium">O'rtacha Ball</span>
                            </div>
                            <div className="text-3xl font-bold text-white">{stats.averageScore}%</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-lg shadow-green-900/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="text-green-200" size={24} />
                                <span className="text-green-200 text-sm font-medium">Qolgan Vaqt</span>
                            </div>
                            <div className="text-3xl font-bold text-white">{formatTime(stats.remainingTime)}</div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-900/20">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="text-blue-200" size={24} />
                                <span className="text-blue-200 text-sm font-medium">Jami Bosqichlar</span>
                            </div>
                            <div className="text-3xl font-bold text-white">{stats.totalStages}</div>
                        </div>
                    </div>

                    {/* Certificate Card */}
                    {showCertificate && certificate && (
                        <div className="mb-8 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-purple-900/50 border-2 border-purple-500/30 rounded-2xl p-8 shadow-2xl">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Award size={48} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                            🎉 Tabriklaymiz!
                                        </h3>
                                        <p className="text-purple-200 mb-1">
                                            Siz barcha bosqichlarni muvaffaqiyatli yakunladingiz!
                                        </p>
                                        <p className="text-purple-300 text-sm">
                                            Umumiy ball: <span className="font-bold text-white">{stats.averageScore}%</span>
                                        </p>
                                        <p className="text-purple-300 text-sm">
                                            Sertifikat raqami: <span className="font-mono text-purple-100">{certificate.certificateNumber}</span>
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/certificate/${certificate.id}`}
                                    target="_blank"
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105"
                                >
                                    <Award size={24} />
                                    Sertifikatni Ko'rish
                                </Link>
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Test Bosqichlari</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stages.map((stage) => {
                                const action = getStageAction(stage);
                                const ActionIcon = action.icon;

                                return (
                                    <div
                                        key={stage.id}
                                        className={`bg-slate-900 border rounded-2xl p-6 transition-all ${stage.isUnlocked
                                            ? 'border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-purple-900/10'
                                            : 'border-slate-800/50 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${stage.isCompleted
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : stage.isUnlocked
                                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                        : 'bg-slate-800 text-slate-600 border border-slate-700'
                                                    }`}>
                                                    {stage.stageNumber}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{stage.title}</h3>
                                                    {stage.isCompleted && stage.score !== undefined && (
                                                        <span className="text-sm text-green-400">Ball: {stage.score}%</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{stage.description}</p>

                                        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                                            {stage.videoUrl && (
                                                <div className="flex items-center gap-1">
                                                    <Video size={14} />
                                                    <span>Video dars</span>
                                                    {stage.videoCompleted && <CheckCircle size={14} className="text-green-500" />}
                                                </div>
                                            )}
                                            {stage.totalQuestions > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <FileText size={14} />
                                                    <span>{stage.totalQuestions} savol</span>
                                                </div>
                                            )}
                                        </div>

                                        {action.disabled ? (
                                            <div className="flex items-center justify-center gap-2 py-3 bg-slate-800/50 rounded-xl text-slate-500">
                                                <Lock size={18} />
                                                <span className="font-medium">{action.text}</span>
                                            </div>
                                        ) : (
                                            <Link
                                                href={action.href}
                                                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20"
                                            >
                                                <ActionIcon size={18} />
                                                <span>{action.text}</span>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {stages.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <p>Hozircha test bosqichlari mavjud emas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
