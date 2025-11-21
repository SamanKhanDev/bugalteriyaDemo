'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { TestStage, Question, Option } from '@/lib/schema';
import TestRunner from '@/components/test/TestRunner';
import { Navbar } from '@/components/layout/Navbar';
import ActivityTracker from '@/components/layout/ActivityTracker';
import { Lock, Video } from 'lucide-react';

interface QuestionWithOptions extends Question {
    id: string;
    options: (Option & { id: string })[];
}

export default function StagePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoadingAuth } = useStore();
    const stageId = params.stageId as string;

    const [stage, setStage] = useState<TestStage | null>(null);
    const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videoLocked, setVideoLocked] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // 1. Fetch Stage Details
                const stageRef = doc(db, 'testStages', stageId);
                const stageSnap = await getDoc(stageRef);

                if (!stageSnap.exists()) {
                    setError('Bosqich topilmadi');
                    setLoading(false);
                    return;
                }

                const stageData = stageSnap.data() as TestStage;
                setStage(stageData);

                // 2. Check if locked
                if (stageData.stageNumber > 1) {
                    const progressRef = doc(db, 'userProgress', user.userId);
                    const progressSnap = await getDoc(progressRef);

                    if (progressSnap.exists()) {
                        const progressData = progressSnap.data();
                        if ((progressData.completedStages?.length || 0) < stageData.stageNumber - 1) {
                            setError('Bu bosqich hali qulfda');
                            setLoading(false);
                            return;
                        }
                    }
                }

                // 3. Fetch Questions
                const questionsRef = collection(db, 'testStages', stageId, 'questions');
                const qQuery = query(questionsRef, orderBy('order'));
                const qSnap = await getDocs(qQuery);

                const questionsData = await Promise.all(qSnap.docs.map(async (qDoc) => {
                    const qData = qDoc.data() as Question;
                    const optionsRef = collection(db, 'testStages', stageId, 'questions', qDoc.id, 'options');
                    const optionsSnap = await getDocs(optionsRef);
                    const options = optionsSnap.docs.map(o => ({ id: o.id, ...o.data() } as Option & { id: string }));
                    return { ...qData, id: qDoc.id, options };
                }));

                setQuestions(questionsData);
            } catch (err) {
                console.error('Error fetching stage:', err);
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

    // Check video requirement
    useEffect(() => {
        if (stage && user) {
            const checkVideo = async () => {
                if (!stage.videoUrl || !stage.videoRequiredPercent) return;

                const progressRef = doc(db, 'userProgress', user.userId);
                const progressSnap = await getDoc(progressRef);

                if (progressSnap.exists()) {
                    const data = progressSnap.data();
                    const stageProgress = data.perStage?.[stageId];

                    // Check if video is completed
                    if (!stageProgress?.videoCompleted) {
                        setVideoLocked(true);
                    }
                } else {
                    setVideoLocked(true);
                }
            };
            checkVideo();
        }
    }, [stage, user, stageId]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading || isLoadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error || !stage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
                <div className="text-red-500 text-xl mb-4">{error || 'Xatolik'}</div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-2 bg-slate-800 rounded-xl hover:bg-slate-700"
                >
                    Dashboardga qaytish
                </button>
            </div>
        );
    }

    if (videoLocked) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                    <Lock size={32} className="text-cyan-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Video Darsni Ko'rish Kerak</h1>
                <p className="text-slate-400 mb-8 max-w-md">
                    Testni boshlashdan oldin ushbu bosqichga oid video darsni to'liq ko'rib chiqishingiz kerak.
                </p>
                <button
                    onClick={() => router.push(`/stage/${stageId}/video`)}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
                >
                    Video Darsga O'tish
                </button>
            </div>
        );
    }

    if (!user) return null;

    return (
        <>
            <Navbar userId={user.userId} userName={user.name} onLogout={handleLogout} />
            <ActivityTracker />

            <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 py-12 px-4">
                <div className="max-w-4xl mx-auto mb-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{stage.title}</h1>
                    <p className="text-slate-400 text-lg mb-6">{stage.description}</p>

                    {stage.videoUrl && (
                        <button
                            onClick={() => router.push(`/stage/${stageId}/video`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Video size={18} />
                            Video Darsga O'tish
                        </button>
                    )}
                </div>

                <TestRunner
                    stageId={stageId}
                    questions={questions}
                />
            </div>
        </>
    );
}
