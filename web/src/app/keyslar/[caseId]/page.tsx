'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CaseStudy, CaseStudyQuestion } from '@/lib/schema';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, FileText, Send, ChevronRight, ChevronLeft, ArrowLeft, Trophy, User } from 'lucide-react';
import { use } from 'react';
import { Navbar } from '@/components/layout/Navbar';

interface CaseAnswer {
    questionId: string;
    answerText: string;
}

export default function CaseStudyRunnerPage({ params }: { params: Promise<{ caseId: string }> }) {
    const { caseId } = use(params);
    const { user, guestUser } = useStore();
    const router = useRouter();
    const activeUser = user || guestUser;

    const [caseItem, setCaseItem] = useState<CaseStudy | null>(null);
    const [questions, setQuestions] = useState<CaseStudyQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<CaseAnswer[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [startTime, setStartTime] = useState<number>(0);
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        loadCase();
    }, [caseId]);

    useEffect(() => {
        if (!loading && caseItem && startTime === 0) {
            setStartTime(Date.now());
        }
    }, [loading, caseItem, startTime]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (startTime !== 0 && !showResults) {
                setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, showResults]);

    const loadCase = async () => {
        try {
            const caseDoc = await getDoc(doc(db, 'caseStudies', caseId));
            if (!caseDoc.exists()) {
                alert('Keys topilmadi');
                router.push('/keyslar');
                return;
            }
            const data = { ...caseDoc.data(), caseId: caseDoc.id } as CaseStudy;
            setCaseItem(data);

            const qSnap = await getDocs(query(collection(db, 'caseStudies', caseId, 'questions')));
            const questionsData = qSnap.docs.map(doc => ({
                ...doc.data(),
                questionId: doc.id
            })) as CaseStudyQuestion[];
            setQuestions(questionsData);
        } catch (error) {
            console.error('Error loading case:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (text: string) => {
        const questionId = questions[currentQuestionIndex].questionId;
        setAnswers(prev => {
            const existing = prev.find(a => a.questionId === questionId);
            if (existing) {
                return prev.map(a => a.questionId === questionId ? { ...a, answerText: text } : a);
            }
            return [...prev, { questionId, answerText: text }];
        });
    };

    const handleSubmit = async () => {
        if (answers.length < questions.length) {
            if (!confirm('Barcha savollarga javob bermadingiz. Shunday bo\'lsa ham topshirmoqchimisiz?')) return;
        }

        setSubmitting(true);
        try {
            const resultData = {
                caseId,
                userId: activeUser?.userId || `guest_${Date.now()}`,
                userName: activeUser?.name || 'Mehmon',
                isGuest: !!activeUser?.isGuest,
                answers,
                totalQuestions: questions.length,
                timeSpentSeconds: timeElapsed,
                status: 'submitted',
                startedAt: Timestamp.fromMillis(startTime),
                completedAt: Timestamp.now()
            };

            await addDoc(collection(db, 'caseStudyResults'), resultData);
            setShowResults(true);
        } catch (error) {
            console.error('Error submitting:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Yuklanmoqda...</div>;
    if (!caseItem) return null;

    if (showResults) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-green-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Muvaffaqiyatli Topshirildi!</h2>
                    <p className="text-slate-400">Javoblaringiz qabul qilindi. Tez orada adminlar tomonidan baholanadi.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 rounded-2xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Sarflangan vaqt</p>
                            <p className="text-xl font-bold text-white">{formatTime(timeElapsed)}</p>
                        </div>
                        <div className="bg-slate-800 rounded-2xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Savollar soni</p>
                            <p className="text-xl font-bold text-white">{questions.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/keyslar')}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Keyslar Ro'yxatiga Qaytish
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion?.questionId)?.answerText || '';
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="text-slate-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-white font-bold truncate max-w-[200px] md:max-w-sm">{caseItem.title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg text-amber-400 font-mono">
                            <Clock size={16} />
                            <span>{formatTime(timeElapsed)}</span>
                        </div>
                        {caseItem.timeLimit && (
                            <div className="text-xs text-slate-500 hidden sm:block">
                                Limit: {Math.floor(caseItem.timeLimit / 60)} daq
                            </div>
                        )}
                    </div>
                </div>
                <div className="h-1 bg-slate-800 w-full overflow-hidden">
                    <div 
                        className="h-full bg-amber-500 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="px-4 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold">
                            SAVOL {currentQuestionIndex + 1} / {questions.length}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                            {currentQuestion?.questionText}
                        </h2>

                        {currentQuestion?.imageUrl && (
                            <div className="rounded-2xl overflow-hidden border border-slate-800">
                                <img src={currentQuestion.imageUrl} alt="Savol rasmi" className="w-full h-auto max-h-[400px] object-contain bg-black/20" />
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-400">Sizning javobingiz:</label>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-amber-500 transition-colors text-lg"
                                rows={8}
                                placeholder="Javobingizni shu yerga yozing..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-slate-400 rounded-xl hover:text-white disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={20} />
                        Oldingisi
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
                        >
                            <Send size={20} />
                            {submitting ? 'Yuborilmoqda...' : 'Topshirish'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-10 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl hover:border-amber-500/50 transition-all"
                        >
                            Keyingisi
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
