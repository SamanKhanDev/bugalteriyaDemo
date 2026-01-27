'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, Timestamp, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { QuickTest, QuickTestLevel, QuickTestQuestion } from '@/lib/schema';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Clock, Trophy, Target, Zap, CheckCircle2, XCircle, Layers, Download, LogOut } from 'lucide-react';
import { use } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { GlobalTimer } from '@/components/common/GlobalTimer';
import { QuestionNavigation } from '@/components/quick-tests/QuestionNavigation';
import { useScreenshotProtection } from '@/hooks/useScreenshotProtection';

interface Answer {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
}

export default function QuickTestRunnerPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = use(params);
    const { user, guestUser, setCurrentTest } = useStore();
    const router = useRouter();

    const activeUser = user || guestUser;

    const [test, setTest] = useState<QuickTest | null>(null);

    useEffect(() => {
        if (test) {
            setCurrentTest({ id: testId, title: test.title });
        }
        return () => setCurrentTest(null);
    }, [test, testId, setCurrentTest]);

    const [levels, setLevels] = useState<QuickTestLevel[]>([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showResults, setShowResults] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastLevelEndTime, setLastLevelEndTime] = useState<number>(0);
    const [levelDurations, setLevelDurations] = useState<Map<string, number>>(new Map());
    const [testStartTime, setTestStartTime] = useState<number>(0);
    const [startCountdown, setStartCountdown] = useState(3);
    const [isStarting, setIsStarting] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    // Ranking State
    const [userRank, setUserRank] = useState<number | null>(null);
    const [topPlayers, setTopPlayers] = useState<any[]>([]);
    const [rankingLoading, setRankingLoading] = useState(false);

    // Screenshot Protection
    useScreenshotProtection({
        enabled: !showResults,
        userId: activeUser?.userId,
        userName: activeUser?.name,
        testId,
        testTitle: test?.title
    });

    useEffect(() => {
        loadTest();
    }, [testId]);

    // Timer Logic
    useEffect(() => {
        if (levels.length > 0 && !isStarting && testStartTime === 0) {
            const now = Date.now();
            setLastLevelEndTime(now);
            setTestStartTime(now);
            console.log('✅ Test boshlandi:', new Date(now).toLocaleString('uz-UZ'));
        }
    }, [levels, isStarting, testStartTime]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (levels.length > 0) {
                setTimeElapsed(Math.floor((Date.now() - lastLevelEndTime) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [levels, lastLevelEndTime]);

    // Countdown
    useEffect(() => {
        if (!loading && levels.length > 0 && startCountdown > 0) {
            const timer = setTimeout(() => setStartCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (startCountdown === 0) {
            setIsStarting(false);
        }
    }, [startCountdown, loading, levels.length]);

    // Prevent Close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!showResults) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [showResults]);

    const loadTest = async () => {
        try {
            const testDoc = await getDoc(doc(db, 'quickTests', testId));

            if (testDoc.exists()) {
                await initializeTest(testDoc.data() as QuickTest, testDoc.id);
            } else {
                alert('Imtihon topilmadi');
                router.push('/quick-tests');
            }
        } catch (error) {
            console.error('Error loading test:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const initializeTest = async (testData: QuickTest, id: string) => {
        const testObj = { ...testData, testId: id };

        if (!checkAvailability(testObj)) return;

        const levelsSnapshot = await getDocs(
            query(collection(db, 'quickTests', id, 'levels'), orderBy('levelNumber'))
        );
        const levelsData = levelsSnapshot.docs.map(doc => ({
            ...doc.data(),
            levelId: doc.id
        })) as QuickTestLevel[];

        finalizeInitialization(testObj, levelsData);
    };

    const checkAvailability = (data: { activeDate?: string; activeStartDate?: string; activeEndDate?: string; activeTimeFrom?: string; activeTimeTo?: string; }) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (data.activeDate && data.activeDate !== today) {
            alert(`Bu imtihon faqat ${data.activeDate} sanasida bo'lib o'tadi`);
            router.push('/quick-tests');
            return false;
        }
        if (data.activeStartDate && today < data.activeStartDate) {
            alert(`Bu imtihon hali boshlanmagan. Boshlanish sanasi: ${data.activeStartDate}`);
            router.push('/quick-tests');
            return false;
        }
        if (data.activeEndDate && today > data.activeEndDate) {
            alert(`Bu imtihon yakunlangan. Yakunlanish sanasi: ${data.activeEndDate}`);
            router.push('/quick-tests');
            return false;
        }
        if (data.activeTimeFrom && currentTime < data.activeTimeFrom) {
            alert(`Bu imtihon soat ${data.activeTimeFrom} da boshlanadi`);
            router.push('/quick-tests');
            return false;
        }
        if (data.activeTimeTo && currentTime > data.activeTimeTo) {
            alert(`Bu imtihon soat ${data.activeTimeTo} da tugaydi`);
            router.push('/quick-tests');
            return false;
        }
        return true;
    };

    const finalizeInitialization = (testData: QuickTest, levelsData: QuickTestLevel[]) => {
        setTest(testData);

        const shuffle = <T,>(array: T[]): T[] => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        // Flatten all questions from all levels into one list
        let allQuestions: QuickTestQuestion[] = [];
        levelsData.forEach(level => {
            allQuestions = [...allQuestions, ...level.questions];
        });

        // Shuffle all questions and their options
        const shuffledQuestions = shuffle(allQuestions).map((question: QuickTestQuestion) => ({
            ...question,
            options: shuffle(question.options)
        }));

        // Create a single unified level
        const unifiedLevel: QuickTestLevel = {
            levelId: 'unified',
            testId: testData.testId,
            levelNumber: 1,
            title: 'Asosiy Imtihon',
            questions: shuffledQuestions,
            // If original levels had time limits, we might want to sum them up here, 
            // but for now we assume the test might have a global time limit or none.
            // We'll leave timeLimit undefined or take from testData if applicable.
        };

        setLevels([unifiedLevel]);
    };

    const currentLevel = levels[currentLevelIndex];
    const currentQuestion = currentLevel?.questions[currentQuestionIndex];
    const totalQuestions = levels.reduce((sum, level) => sum + level.questions.length, 0);
    const answeredQuestions = answers.length;
    const progress = (answeredQuestions / totalQuestions) * 100;

    // Sync selectedAnswer
    useEffect(() => {
        if (currentQuestion) {
            const existingAnswer = answers.find(a => a.questionId === currentQuestion.questionId);
            setSelectedAnswer(existingAnswer ? existingAnswer.selectedOptionId : null);
        }
    }, [currentQuestion, answers]);


    const handleAnswer = (optionId: string) => {
        setSelectedAnswer(optionId);
    };

    const findNextUnansweredIndex = (startIndex: number, questions: any[], currentAnswers: Answer[]): number => {
        for (let i = startIndex + 1; i < questions.length; i++) {
            const isAnswered = currentAnswers.some(a => a.questionId === questions[i].questionId);
            if (!isAnswered) return i;
        }
        for (let i = 0; i <= startIndex; i++) {
            const isAnswered = currentAnswers.some(a => a.questionId === questions[i].questionId);
            if (!isAnswered) return i;
        }
        return -1;
    };

    const handleNext = () => {
        if (!currentQuestion || !selectedAnswer) return;

        const isCorrect = currentQuestion.options.find(o => o.optionId === selectedAnswer)?.isCorrect || false;

        const newAnswer: Answer = {
            questionId: currentQuestion.questionId,
            selectedOptionId: selectedAnswer,
            isCorrect
        };

        const updatedAnswers = [...answers.filter(a => a.questionId !== currentQuestion.questionId), newAnswer];
        setAnswers(updatedAnswers);
        setSelectedAnswer(null);

        const nextIndex = findNextUnansweredIndex(currentQuestionIndex, currentLevel.questions, updatedAnswers);

        if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            // Level finished
            const now = Date.now();
            const duration = Math.floor((now - lastLevelEndTime) / 1000);

            const newDurations = new Map(levelDurations);
            newDurations.set(currentLevel.levelId, duration);
            setLevelDurations(newDurations);
            setLastLevelEndTime(now);

            if (currentLevelIndex < levels.length - 1) {
                setCurrentLevelIndex(currentLevelIndex + 1);
                setCurrentQuestionIndex(0);
            } else {
                submitTest(newDurations, updatedAnswers);
            }
        }
    };

    const handleSkip = () => {
        setSelectedAnswer(null);
        const nextIndex = findNextUnansweredIndex(currentQuestionIndex, currentLevel.questions, answers);

        if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            if (nextIndex === currentQuestionIndex) {
                alert("Siz bu bosqichdagi barcha boshqa savollarga javob berdingiz. Ushbu savolga javob bering.");
            }
        }
    };

    // Real-time Leaderboard Listener
    useEffect(() => {
        if (!showResults) return;

        setRankingLoading(true);
        const q = query(
            collection(db, 'quickTestResults'),
            where('testId', '==', testId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    userId: data.userId as string,
                    userName: data.userName as string,
                    score: data.score as number,
                    timeSpentSeconds: data.timeSpentSeconds as number,
                    totalQuestions: data.totalQuestions as number,
                    startedAt: data.startedAt // Keep as Firestore Timestamp
                };
            });

            // 1. Group by Attempt (User + Start Time)
            const attempts = new Map<string, {
                userId: string,
                userName: string,
                score: number,
                time: number,
                totalQuestions: number,
                startTime: number
            }>();

            results.forEach(r => {
                // Compatibility for cases where startedAt might be missing or different format
                const startTime = r.startedAt?.toMillis?.() || 0;
                const attemptId = `${r.userId}_${startTime}`;

                const stats = attempts.get(attemptId) || {
                    userId: r.userId,
                    userName: r.userName,
                    score: 0,
                    time: 0,
                    totalQuestions: 0,
                    startTime: startTime
                };

                stats.score += r.score;
                stats.time += r.timeSpentSeconds;
                stats.totalQuestions += r.totalQuestions;
                attempts.set(attemptId, stats);
            });

            // 2. Pick Best Attempt per User
            const userBestStats = new Map<string, any>();
            attempts.forEach(attempt => {
                const existing = userBestStats.get(attempt.userId);
                // Criteria: Higher score, or same score with less time
                if (!existing ||
                    attempt.score > existing.score ||
                    (attempt.score === existing.score && attempt.time < existing.time)) {
                    userBestStats.set(attempt.userId, attempt);
                }
            });

            // 3. Final Leaderboard Sort
            const leaderboard = Array.from(userBestStats.values()).sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.time - b.time;
            });

            // Set Top 5
            setTopPlayers(leaderboard.slice(0, 5));

            // Set Current User Rank
            const currentUserId = activeUser?.userId || localStorage.getItem('lastSubmittedUserId');
            if (currentUserId) {
                const rank = leaderboard.findIndex(u => u.userId === currentUserId) + 1;
                if (rank > 0) setUserRank(rank);
            }

            setRankingLoading(false);
        }, (error) => {
            console.error("Leaderboard listener error:", error);
            setRankingLoading(false);
        });

        return () => unsubscribe();
    }, [showResults, testId, activeUser?.userId]);

    const submitTest = async (finalDurations: Map<string, number>, finalAnswers: Answer[]) => {
        setSubmitting(true);
        try {
            const userIdToUse = activeUser?.userId || `guest_${Date.now()}`;
            // Store ID for rank matching in listener
            if (!activeUser?.userId) localStorage.setItem('lastSubmittedUserId', userIdToUse);

            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];
                const levelAnswers = finalAnswers.filter(a =>
                    level.questions.some(q => q.questionId === a.questionId)
                );
                const levelScore = levelAnswers.filter(a => a.isCorrect).length;
                const levelDuration = finalDurations.get(level.levelId) || 0;

                await addDoc(collection(db, 'quickTestResults'), {
                    testId,
                    userId: userIdToUse,
                    userName: activeUser?.name || 'Mehmon',
                    isGuest: activeUser?.isGuest || false,
                    levelId: level.levelId,
                    levelNumber: level.levelNumber,
                    score: levelScore,
                    totalQuestions: level.questions.length,
                    timeSpentSeconds: levelDuration,
                    answers: levelAnswers,
                    startedAt: Timestamp.fromMillis(testStartTime),
                    completedAt: Timestamp.now()
                });
            }

            // We rely on the useEffect listener to update rank now
            setShowResults(true);
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Natijalarni saqlashda xatolik');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLogout = async () => {
        if (confirm('Tizimdan chiqmoqchimisiz? Imtihon natijalari saqlanmasligi mumkin.')) {
            try {
                await signOut(auth);
                localStorage.removeItem('guestUser');
                router.push(`/quick-tests`);
            } catch (error) {
                console.error('Error signing out:', error);
            }
        }
    };

    const downloadCertificate = async () => {
        if (!user || !test) return;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Simplified drawing - same as before
        doc.setFillColor(13, 42, 87);
        doc.rect(0, 0, 297, 210, 'F');
        doc.setFillColor(255, 255, 255);
        doc.rect(70, 25, 85, 1.5, 'F');
        doc.rect(242, 25, 85, 1.5, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(148.5, 25, 12, 'F');
        doc.setFillColor(13, 42, 87);
        doc.circle(148.5, 25, 10, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(148.5, 25, 6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(56);
        doc.setTextColor(255, 255, 255);
        doc.text('SERTIFIKAT', 148.5, 65, { align: 'center' });

        doc.setFontSize(20);
        doc.setTextColor(255, 193, 7);
        doc.text('MUKOFOT', 148.5, 78, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('Quyidagi shaxsga taqdim etiladi:', 148.5, 92, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.setTextColor(255, 193, 7);
        doc.text(user.name.toUpperCase(), 148.5, 108, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(`${test.title} imtihonini muvaffaqiyatli`, 148.5, 122, { align: 'center' });
        doc.text('yakunlagani uchun.', 148.5, 130, { align: 'center' });

        const score = answers.filter(a => a.isCorrect).length;
        const totalQuestions = levels.reduce((sum, level) => sum + level.questions.length, 0);
        const percentage = (score / totalQuestions) * 100;

        doc.setFillColor(255, 193, 7);
        doc.circle(148.5, 155, 15, 'F');
        doc.setFillColor(255, 215, 77);
        doc.circle(148.5, 155, 12, 'F');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('★', 148.5, 160, { align: 'center' });

        const endTime = new Date();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Natija', 80, 185);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${score}/${totalQuestions} (${percentage.toFixed(1)}%)`, 80, 192);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Sana', 217, 185);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(endTime.toLocaleDateString('uz-UZ'), 217, 192);

        try {
            const qrCodeDataUrl = await QRCode.toDataURL('https://bugaltersiz.uz', {
                width: 200,
                margin: 1,
                color: { dark: '#FFFFFF', light: '#0D2A57' }
            });
            doc.addImage(qrCodeDataUrl, 'PNG', 260, 175, 25, 25);
        } catch (error) {
            console.error('QR Code error:', error);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 193, 7);
        doc.text('www.bugaltersiz.uz', 148.5, 202, { align: 'center' });

        doc.save(`${user.name}_sertifikat.pdf`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (isStarting && !loading && levels.length > 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-8">
                        {startCountdown}
                    </div>
                    <p className="text-2xl text-white font-medium">Imtihon boshlanmoqda...</p>
                    <p className="text-slate-400 mt-2">Tayyorlaning!</p>
                </div>
            </div>
        );
    }

    if (submitting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Natijalar saqlanmoqda...</p>
                </div>
            </div>
        );
    }

    if (showResults) {
        const score = answers.filter(a => a.isCorrect).length;
        const totalQuestions = levels.reduce((sum, level) => sum + level.questions.length, 0);
        const percentage = (score / totalQuestions) * 100;
        const passed = percentage >= 60;
        const hasCertificate = test?.certificateThreshold !== undefined && percentage >= test.certificateThreshold;

        let totalTimeSeconds = 0;
        levelDurations.forEach((duration) => {
            totalTimeSeconds += duration;
        });

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 pt-20">
                <div className="max-w-4xl w-full">
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">

                        {/* Confetti Particles */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-sm animate-bounce opacity-50"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa'][i % 5],
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${2 + Math.random() * 3}s`
                                    }}
                                />
                            ))}
                        </div>

                        {hasCertificate && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-yellow-500/10 to-transparent" />
                            </div>
                        )}

                        <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center relative z-10 ${passed
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : 'bg-gradient-to-br from-orange-500 to-red-600'
                            }`}>
                            {passed ? <Trophy className="text-white" size={48} /> : <Target className="text-white" size={48} />}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
                            {passed ? 'Tabriklaymiz! 🎉' : 'Yaxshi Harakat! 💪'}
                        </h2>

                        <div className="mb-8 relative z-10">
                            <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-400' : 'text-orange-400'}`}>
                                {percentage.toFixed(0)}%
                            </div>
                            <p className="text-slate-400">
                                {score} ta to&apos;g&apos;ri javob {totalQuestions} ta savoldan
                            </p>
                        </div>

                        {/* KAHOT-STYLE PODIUM LEADERBOARD */}
                        {topPlayers.length > 0 && (
                            <div className="mb-12 relative z-10 animate-in fade-in duration-1000">
                                <h3 className="text-xl font-bold text-white mb-8 flex items-center justify-center gap-2">
                                    <Trophy size={24} className="text-yellow-400" />
                                    G'oliblar Shoxsupasi
                                </h3>

                                <div className="flex items-end justify-center gap-2 sm:gap-4 px-2 mb-8">
                                    {/* 2ND PLACE */}
                                    {topPlayers[1] && (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-20 duration-700 delay-300 fill-mode-both w-1/3 max-w-[120px]">
                                            <div className="mb-3 text-center">
                                                <p className="text-xs sm:text-sm font-bold text-slate-300 truncate w-full px-1">
                                                    {topPlayers[1].userName}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold">{(topPlayers[1].score / topPlayers[1].totalQuestions * 100).toFixed(0)}%</p>
                                                <p className="text-[9px] text-slate-600 font-medium">{topPlayers[1].score}/{topPlayers[1].totalQuestions}</p>
                                            </div>
                                            <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-lg border-x border-t border-slate-400/20">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-400 flex items-center justify-center text-slate-900 font-bold text-lg sm:text-xl shadow-inner">2</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 1ST PLACE - CENTER */}
                                    {topPlayers[0] && (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-32 duration-1000 fill-mode-both relative z-20 w-1/3 max-w-[140px]">
                                            <div className="absolute -top-10 sm:-top-12 animate-bounce">
                                                <Trophy size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] sm:w-[40px] sm:h-[40px]" />
                                            </div>
                                            <div className="mb-3 text-center">
                                                <p className="text-sm sm:text-lg font-black text-white truncate w-full px-1">
                                                    {topPlayers[0].userName}
                                                </p>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-xs sm:text-sm font-bold text-yellow-400">{(topPlayers[0].score / topPlayers[0].totalQuestions * 100).toFixed(0)}%</p>
                                                    <p className="text-[10px] text-yellow-600/70 font-bold">{topPlayers[0].score}/{topPlayers[0].totalQuestions}</p>
                                                </div>
                                            </div>
                                            <div className="w-full h-36 sm:h-48 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-[0_0_30px_rgba(250,204,21,0.2)] border-x border-t border-yellow-200/30">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-900 font-black text-2xl sm:text-3xl shadow-lg ring-4 ring-yellow-400/50">1</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3RD PLACE */}
                                    {topPlayers[2] && (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-16 duration-700 delay-500 fill-mode-both w-1/3 max-w-[120px]">
                                            <div className="mb-3 text-center">
                                                <p className="text-xs sm:text-sm font-bold text-slate-400 truncate w-full px-1">
                                                    {topPlayers[2].userName}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold">{(topPlayers[2].score / topPlayers[2].totalQuestions * 100).toFixed(0)}%</p>
                                                <p className="text-[9px] text-slate-600 font-medium">{topPlayers[2].score}/{topPlayers[2].totalQuestions}</p>
                                            </div>
                                            <div className="w-full h-16 sm:h-24 bg-gradient-to-t from-orange-800 to-orange-600 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-lg border-x border-t border-orange-400/20">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-400 flex items-center justify-center text-orange-900 font-bold text-lg sm:text-xl shadow-inner">3</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RUNNERS UP (4-5) */}
                                {topPlayers.length > 3 && (
                                    <div className="max-w-md mx-auto bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 delay-1000 fill-mode-both">
                                        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 text-center">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 tracking-widest">Keyingi o'rinlar</span>
                                        </div>
                                        <div className="divide-y divide-slate-700/30">
                                            {topPlayers.slice(3, 5).map((player, idx) => (
                                                <div key={player.userId} className={`flex items-center justify-between px-6 py-3 ${(activeUser?.userId === player.userId || localStorage.getItem('lastSubmittedUserId') === player.userId)
                                                    ? 'bg-cyan-500/10'
                                                    : ''
                                                    }`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-slate-500 font-bold">{idx + 4}</span>
                                                        <span className={`text-sm font-medium ${(activeUser?.userId === player.userId || localStorage.getItem('lastSubmittedUserId') === player.userId)
                                                            ? 'text-cyan-400'
                                                            : 'text-slate-300'
                                                            }`}>
                                                            {player.userName}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-sm font-bold text-white">{(player.score / player.totalQuestions * 100).toFixed(0)}%</span>
                                                        <span className="text-[10px] text-slate-500 font-bold">{player.score}/{player.totalQuestions}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {hasCertificate && (
                            <div className="mb-8 relative z-10">
                                <div className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl">
                                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Sertifikat Mavjud! 🎓</h3>
                                    <p className="text-slate-400 mb-4 text-sm">
                                        Siz {test?.certificateThreshold}% dan yuqori natija ko'rsatdingiz.
                                    </p>
                                    <button
                                        onClick={downloadCertificate}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-yellow-500/20 transition-all font-medium"
                                    >
                                        <Download size={20} />
                                        Sertifikatni Yuklab Olish
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 relative z-10">
                            {/* Rank Badge */}
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent shadow-lg text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Trophy className="text-yellow-400" size={18} />
                                    <span className="text-xl font-bold text-white">
                                        {rankingLoading ? '...' : (userRank ? `#${userRank}` : '-')}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">O'rningiz</p>
                            </div>

                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <CheckCircle2 className="text-green-400" size={18} />
                                    <span className="text-xl font-bold text-white">{score}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">To&apos;g&apos;ri</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <XCircle className="text-red-400" size={18} />
                                    <span className="text-xl font-bold text-white">{totalQuestions - score}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Noto&apos;g&apos;ri</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Clock className="text-blue-400" size={18} />
                                    <span className="text-xl font-bold text-white">{formatTime(totalTimeSeconds)}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Vaqt</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-center col-span-2 md:col-span-1">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Layers className="text-purple-400" size={18} />
                                    <span className="text-xl font-bold text-white">{test?.totalLevels || levels.length}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Bosqich</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                            <button
                                onClick={() => router.push('/quick-tests')}
                                className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                Bosh Sahifa
                            </button>
                            <button
                                onClick={() => router.push('/quick-tests/leaderboard')}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                            >
                                <Trophy size={20} />
                                Reytingni Ko&apos;rish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentLevel || !currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <p className="text-slate-400">Imtihon topilmadi</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Standard Navbar for existing runner */}
            <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50 shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-base font-bold text-white truncate">{test?.title}</h1>
                            <p className="text-xs text-slate-400">
                                {currentLevel.title} • Savol {currentQuestionIndex + 1}/{currentLevel.questions.length}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {activeUser && !activeUser.isGuest && (
                                <GlobalTimer
                                    userId={activeUser.userId}
                                    variant="navbar"
                                    className="scale-90 opacity-80 hover:opacity-100 transition-opacity"
                                />
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                                <Clock className="text-cyan-400" size={16} />
                                <span className="text-white font-mono text-sm">{formatTime(timeElapsed)}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Chiqish"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-2">
                        <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                            <span>{answeredQuestions} / {totalQuestions}</span>
                            <span>{progress.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
                <div className="flex-1 w-full">
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-800 px-4 sm:px-6 py-2.5 sm:py-3">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Layers size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="font-medium text-xs sm:text-base">{currentLevel.title}</span>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="mb-4 sm:mb-6">
                                <div className="flex items-start gap-2 sm:gap-3 mb-4">
                                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-1">
                                        <span className="text-cyan-400 font-bold text-sm sm:text-base">{currentQuestionIndex + 1}</span>
                                    </div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-relaxed flex-1">
                                        {currentQuestion.questionText}
                                    </h2>
                                </div>
                            </div>

                            {currentQuestion.imageUrl && (
                                <div className="mb-6">
                                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50 p-2 sm:p-4">
                                        <img
                                            src={currentQuestion.imageUrl}
                                            alt="Savol rasmi"
                                            className="w-full h-auto max-h-[250px] sm:max-h-[400px] object-contain mx-auto"
                                            onError={(e) => {
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `...`;
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2.5 sm:space-y-3">
                                <p className="text-[10px] sm:text-sm text-slate-400 mb-2 sm:mb-3 flex items-center gap-2 uppercase tracking-widest font-bold">
                                    <Zap size={14} className="text-cyan-400" />
                                    Javobni tanlang:
                                </p>
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option.optionId;
                                    return (
                                        <button
                                            key={option.optionId}
                                            onClick={() => handleAnswer(option.optionId)}
                                            className={`group w-full text-left p-3.5 sm:p-4 border-2 rounded-xl transition-all duration-200 active:scale-[0.98] ${isSelected
                                                ? 'bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-400/10'
                                                : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5 ${isSelected
                                                    ? 'border-cyan-400 bg-cyan-500'
                                                    : 'border-slate-600 group-hover:border-cyan-500'
                                                    }`}>
                                                    <span className={`text-[10px] font-bold ${isSelected
                                                        ? 'text-white'
                                                        : 'text-slate-500 group-hover:text-cyan-400'
                                                        }`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                </div>
                                                <span className={`text-sm sm:text-base transition-colors leading-relaxed ${isSelected
                                                    ? 'text-white font-medium'
                                                    : 'text-slate-200 group-hover:text-white'
                                                    }`}>
                                                    {option.text}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                                {selectedAnswer ? (
                                    <button
                                        onClick={handleNext}
                                        className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all font-bold text-lg"
                                    >
                                        Keyingi
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSkip}
                                        className="w-full sm:w-auto px-10 py-4 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-colors font-medium border border-slate-700"
                                    >
                                        O'tkazib yuborish
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0">
                    <QuestionNavigation
                        levels={levels}
                        answers={answers}
                        currentLevelIndex={currentLevelIndex}
                        currentQuestionIndex={currentQuestionIndex}
                        onNavigate={(levelIdx, questionIdx) => {
                            setCurrentLevelIndex(levelIdx);
                            setCurrentQuestionIndex(questionIdx);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
