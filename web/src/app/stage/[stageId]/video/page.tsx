'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { TestStage } from '@/lib/schema';
import dynamic from 'next/dynamic';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import ActivityTracker from '@/components/layout/ActivityTracker';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function VideoPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoadingAuth } = useStore();
    const stageId = params.stageId as string;

    const [stage, setStage] = useState<TestStage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [played, setPlayed] = useState(0);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const stageRef = doc(db, 'testStages', stageId);
                const stageSnap = await getDoc(stageRef);

                if (!stageSnap.exists()) {
                    setError('Bosqich topilmadi');
                    setLoading(false);
                    return;
                }

                const stageData = stageSnap.data() as TestStage;
                setStage(stageData);

                const progressRef = doc(db, 'userProgress', user.userId);
                const progressSnap = await getDoc(progressRef);

                if (progressSnap.exists()) {
                    const data = progressSnap.data();
                    const stageProgress = data.perStage?.[stageId];
                    if (stageProgress?.videoCompleted) {
                        setIsCompleted(true);
                    }
                }

            } catch (err) {
                console.error(err);
                setError('Ma\'lumotlarni yuklashda xatolik');
            } finally {
                setLoading(false);
            }
        };

        if (!isLoadingAuth && user) {
            fetchData();
        } else if (!isLoadingAuth && !user) {
            router.push('/auth/login');
        }
    }, [stageId, user, isLoadingAuth, router]);

    const handleProgress = (state: { played: number; playedSeconds: number }) => {
        setPlayed(state.played);
        setPlayedSeconds(state.playedSeconds);

        if (!stage || !user || isCompleted || redirecting) return;

        const percent = state.played * 100;
        const required = stage.videoRequiredPercent || 0;

        if (required > 0 && percent >= required) {
            setIsCompleted(true);
            setRedirecting(true);

            saveCompletedProgress().then(() => {
                setTimeout(() => {
                    router.push(`/stage/${stageId}`);
                }, 2000);
            });
        }
    };

    const saveCompletedProgress = async () => {
        if (!user || !stage) return;

        try {
            const progressRef = doc(db, 'userProgress', user.userId);
            const progressDoc = await getDoc(progressRef);

            if (!progressDoc.exists()) {
                await setDoc(progressRef, {
                    completedStages: [],
                    totalCorrect: 0,
                    totalWrong: 0,
                    perStage: {
                        [stageId]: {
                            videoWatchedSeconds: playedSeconds,
                            videoCompleted: true,
                            completed: false,
                            correctCount: 0,
                            wrongCount: 0,
                            timeSpentSeconds: 0,
                            startedAt: new Date().toISOString()
                        }
                    }
                });
            } else {
                await updateDoc(progressRef, {
                    [`perStage.${stageId}.videoWatchedSeconds`]: playedSeconds,
                    [`perStage.${stageId}.videoCompleted`]: true,
                    [`perStage.${stageId}.startedAt`]: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('Error saving progress:', err);
        }
    };

    const saveProgress = async () => {
        if (!user || !stage) return;

        try {
            const progressRef = doc(db, 'userProgress', user.userId);
            const progressDoc = await getDoc(progressRef);

            if (!progressDoc.exists()) {
                await setDoc(progressRef, {
                    completedStages: [],
                    totalCorrect: 0,
                    totalWrong: 0,
                    perStage: {
                        [stageId]: {
                            videoWatchedSeconds: playedSeconds,
                            videoCompleted: isCompleted,
                            completed: false,
                            correctCount: 0,
                            wrongCount: 0,
                            timeSpentSeconds: 0,
                            startedAt: new Date().toISOString()
                        }
                    }
                });
            } else {
                await updateDoc(progressRef, {
                    [`perStage.${stageId}.videoWatchedSeconds`]: playedSeconds,
                    [`perStage.${stageId}.videoCompleted`]: isCompleted,
                    [`perStage.${stageId}.startedAt`]: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('Error saving progress:', err);
        }
    };

    const handlePause = () => saveProgress();
    const handleEnded = () => {
        setIsCompleted(true);
        setRedirecting(true);

        saveCompletedProgress().then(() => {
            setTimeout(() => {
                router.push(`/stage/${stageId}`);
            }, 2000);
        });
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return url;

        const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
        if (driveMatch) {
            return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        }

        return url;
    };

    const isGoogleDrive = (url?: string | null) => {
        return url && url.includes('drive.google.com');
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!user) return null;

    if (error || !stage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
                <div className="text-red-500 text-xl mb-4">{error || 'Xatolik'}</div>
                <button onClick={() => router.back()} className="px-6 py-2 bg-slate-800 rounded-xl">Ortga</button>
            </div>
        );
    }

    return (
        <>
            <Navbar userId={user.userId} userName={user.name} onLogout={handleLogout} />
            <ActivityTracker />

            {redirecting && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="bg-slate-900 border border-green-500/20 rounded-2xl p-8 max-w-md text-center">
                        <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
                        <h2 className="text-2xl font-bold text-white mb-2">Video Tugallandi!</h2>
                        <p className="text-slate-400 mb-4">Testga yo'naltirilmoqda...</p>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Ortga qaytish</span>
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                                {stage.videoUrl ? (
                                    isGoogleDrive(stage.videoUrl) ? (
                                        <iframe
                                            src={getEmbedUrl(stage.videoUrl)}
                                            width="100%"
                                            height="100%"
                                            allow="autoplay"
                                            className="w-full h-full"
                                            onLoad={() => {
                                                // Google Drive videolari uchun progressni tekshirib bo'lmaydi
                                                // Shuning uchun shunchaki testni ochib qo'yamiz
                                                setIsCompleted(true);
                                                setPlayed(1);
                                                saveCompletedProgress();
                                            }}
                                        />
                                    ) : (
                                        <ReactPlayer
                                            {...({
                                                ref: playerRef,
                                                url: stage.videoUrl,
                                                width: "100%",
                                                height: "100%",
                                                controls: true,
                                                onProgress: handleProgress,
                                                onReady: () => {
                                                    if (playerRef.current) {
                                                        setDuration(playerRef.current.getDuration());
                                                    }
                                                },
                                                onPause: handlePause,
                                                onEnded: handleEnded
                                            } as any)}
                                        />
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        Video mavjud emas
                                    </div>
                                )}
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">{stage.title}</h1>
                                <p className="text-slate-400">{stage.description}</p>
                                {stage.videoUrl && isGoogleDrive(stage.videoUrl) && (
                                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <p className="text-blue-400 text-sm">
                                            ℹ️ Google Drive videolar uchun progress tracking mavjud emas.
                                            Video yuklangandan keyin avtomatik ravishda testga yo'naltiriladi.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-8">
                                <h3 className="text-lg font-semibold text-white mb-4">Dars holati</h3>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm text-slate-400 mb-2">
                                            <span>Ko'rilgan qismi</span>
                                            <span>{Math.round(played * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-cyan-500'}`}
                                                style={{ width: `${played * 100}%` }}
                                            />
                                        </div>
                                        {stage.videoRequiredPercent && !isGoogleDrive(stage.videoUrl) && (
                                            <p className="text-xs text-slate-500 mt-2">
                                                {stage.videoRequiredPercent}% ga yetganda avtomatik testga yo'naltiriladi
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => router.push(`/stage/${stageId}`)}
                                        disabled={!isCompleted && (stage.videoRequiredPercent || 0) > 0}
                                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isCompleted || (stage.videoRequiredPercent || 0) === 0
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-900/20 hover:shadow-green-900/30'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {isCompleted || (stage.videoRequiredPercent || 0) === 0 ? (
                                            <>
                                                <CheckCircle size={20} />
                                                Testni Boshlash
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={20} />
                                                Test Qulfda
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
