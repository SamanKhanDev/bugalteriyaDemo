'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { QuickTest, QuickTestLevel } from '@/lib/schema';
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

    // Screenshot Protection - Maximum security with logging
    const BlurOverlay = useScreenshotProtection({
        enabled: !showResults,
        userId: activeUser?.userId,
        userName: activeUser?.name,
        testId,
        testTitle: test?.title
    });


    useEffect(() => {
        loadTest();
    }, [testId]);

    // Initialize timer when countdown finishes (test actually starts)
    useEffect(() => {
        if (levels.length > 0 && !isStarting && testStartTime === 0) {
            const now = Date.now();
            setLastLevelEndTime(now);
            setTestStartTime(now);
            console.log('✅ Test boshlandi:', new Date(now).toLocaleString('uz-UZ'));
        }
    }, [levels, isStarting, testStartTime]);

    // Timer interval for UI
    useEffect(() => {
        const interval = setInterval(() => {
            if (levels.length > 0) {
                setTimeElapsed(Math.floor((Date.now() - lastLevelEndTime) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [levels, lastLevelEndTime]);

    // Countdown logic
    useEffect(() => {
        if (!loading && levels.length > 0 && startCountdown > 0) {
            const timer = setTimeout(() => setStartCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (startCountdown === 0) {
            setIsStarting(false);
        }
    }, [startCountdown, loading, levels.length]);

    // Prevent window close
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
            if (!testDoc.exists()) {
                alert('Imtihon topilmadi');
                router.push('/quick-tests');
                return;
            }

            const testData = { ...testDoc.data(), testId: testDoc.id } as QuickTest;

            // Check availability (Date and Time)
            const now = new Date();

            // Check specific date if set
            if (testData.activeDate) {
                // Get local date string in YYYY-MM-DD format
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const today = `${year}-${month}-${day}`;

                if (testData.activeDate !== today) {
                    alert(`Bu imtihon faqat ${testData.activeDate} sanasida bo'lib o'tadi`);
                    router.push('/quick-tests');
                    return;
                }
            }

            // Check time range
            if (testData.activeTimeFrom && testData.activeTimeTo) {
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                if (currentTime < testData.activeTimeFrom) {
                    alert(`Bu imtihon soat ${testData.activeTimeFrom} dan boshlanadi`);
                    router.push('/quick-tests');
                    return;
                }
                if (currentTime > testData.activeTimeTo) {
                    alert(`Bu imtihon soat ${testData.activeTimeTo} da tugaydi`);
                    router.push('/quick-tests');
                    return;
                }
            }

            setTest(testData);

            const levelsSnapshot = await getDocs(
                query(collection(db, 'quickTests', testId, 'levels'), orderBy('levelNumber'))
            );
            const levelsData = levelsSnapshot.docs.map(doc => ({
                ...doc.data(),
                levelId: doc.id
            })) as QuickTestLevel[];

            const shuffle = <T,>(array: T[]): T[] => {
                const shuffled = [...array];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled;
            };

            const randomizedLevels = levelsData.map(level => ({
                ...level,
                questions: shuffle(level.questions).map(question => ({
                    ...question,
                    options: shuffle(question.options)
                }))
            }));

            setLevels(randomizedLevels);
        } catch (error) {
            console.error('Error loading test:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const currentLevel = levels[currentLevelIndex];
    const currentQuestion = currentLevel?.questions[currentQuestionIndex];
    const totalQuestions = levels.reduce((sum, level) => sum + level.questions.length, 0);
    const answeredQuestions = answers.length;
    const progress = (answeredQuestions / totalQuestions) * 100;

    // Debug: Log image URL when question changes
    useEffect(() => {
        if (currentQuestion?.imageUrl) {
            console.log('🖼️ Savol rasmi URL:', currentQuestion.imageUrl);
            console.log('📍 Savol:', currentQuestion.questionText?.substring(0, 50) + '...');
        }
    }, [currentQuestion]);

    // Sync selectedAnswer with existing answers when question changes
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
        // First check from next index to end
        for (let i = startIndex + 1; i < questions.length; i++) {
            const isAnswered = currentAnswers.some(a => a.questionId === questions[i].questionId);
            if (!isAnswered) return i;
        }
        // Then check from start to current index (loop)
        for (let i = 0; i <= startIndex; i++) {
            const isAnswered = currentAnswers.some(a => a.questionId === questions[i].questionId);
            if (!isAnswered) return i;
        }
        return -1; // All answered
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
        setSelectedAnswer(null); // Reset selection

        // Find next question
        const nextIndex = findNextUnansweredIndex(currentQuestionIndex, currentLevel.questions, updatedAnswers);

        if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            // Level finished - all answered
            const now = Date.now();
            const duration = Math.floor((now - lastLevelEndTime) / 1000);

            // Update durations map
            const newDurations = new Map(levelDurations);
            newDurations.set(currentLevel.levelId, duration);
            setLevelDurations(newDurations);
            setLastLevelEndTime(now);

            if (currentLevelIndex < levels.length - 1) {
                // Move to next level
                setCurrentLevelIndex(currentLevelIndex + 1);
                setCurrentQuestionIndex(0);
            } else {
                // Test finished
                submitTest(newDurations, updatedAnswers);
            }
        }
    };

    const handleSkip = () => {
        setSelectedAnswer(null); // Reset selection

        // Find next question without marking current as answered
        const nextIndex = findNextUnansweredIndex(currentQuestionIndex, currentLevel.questions, answers);

        if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            // Only current question remains unanswered?
            // If skip acts as "stay" when only 1 left, or maybe force answer?
            // If user skips the ONLY remaining question, just stay on it?
            // Or if they skipped everything, we should probably just loop.
            // But findNextUnansweredIndex handles looping. 
            // If it returns -1, it means EVERYTHING is answered (but here we are skipping, so current is NOT answered).
            // So logic needs to be careful: current question IS unanswered.

            // Re-find next OTHER than current?
            // Actually findNextUnansweredIndex will return current index if it's the only one left.
            // Let's verify loop logic:
            // if startIndex=0, questions=[Q1], isAnswered=false.
            // Loop 1 (1 to 1): Empty.
            // Loop 2 (0 to 0): checks Q1. Not answered. Return 0.
            // So if nextIndex === currentQuestionIndex, it means only this question is left.
            // We can just alert user or do nothing.

            if (nextIndex === currentQuestionIndex) {
                // Only this question left
                alert("Siz bu bosqichdagi barcha boshqa savollarga javob berdingiz. Ushbu savolga javob bering.");
            }
        }
    };

    const submitTest = async (finalDurations: Map<string, number>, finalAnswers: Answer[]) => {
        setSubmitting(true);
        try {
            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];
                const levelAnswers = finalAnswers.filter(a =>
                    level.questions.some(q => q.questionId === a.questionId)
                );
                const levelScore = levelAnswers.filter(a => a.isCorrect).length;
                const levelDuration = finalDurations.get(level.levelId) || 0;

                await addDoc(collection(db, 'quickTestResults'), {
                    testId,
                    userId: activeUser?.userId || `guest_${Date.now()}`,
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
                // Clear guest data if any
                localStorage.removeItem('guestUser');
                router.push(`/quick-tests/public/${testId}`);
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

        // Dark Blue Background
        doc.setFillColor(13, 42, 87);
        doc.rect(0, 0, 297, 210, 'F');

        // Top decorative lines
        doc.setFillColor(255, 255, 255);
        doc.rect(70, 25, 85, 1.5, 'F');
        doc.rect(242, 25, 85, 1.5, 'F');

        // Center circle
        doc.setFillColor(255, 255, 255);
        doc.circle(148.5, 25, 12, 'F');
        doc.setFillColor(13, 42, 87);
        doc.circle(148.5, 25, 10, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(148.5, 25, 6, 'F');

        // "SERTIFIKAT" title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(56);
        doc.setTextColor(255, 255, 255);
        doc.text('SERTIFIKAT', 148.5, 65, { align: 'center' });

        // "MUKOFOT" subtitle in golden
        doc.setFontSize(20);
        doc.setTextColor(255, 193, 7);
        doc.text('MUKOFOT', 148.5, 78, { align: 'center' });

        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('Quyidagi shaxsga taqdim etiladi:', 148.5, 92, { align: 'center' });

        // User Name in GOLDEN
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.setTextColor(255, 193, 7);
        doc.text(user.name.toUpperCase(), 148.5, 108, { align: 'center' });

        // Achievement
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(`${test.title} imtihonini muvaffaqiyatli`, 148.5, 122, { align: 'center' });
        doc.text('yakunlagani uchun.', 148.5, 130, { align: 'center' });

        // Stats
        const score = answers.filter(a => a.isCorrect).length;
        const totalQuestions = levels.reduce((sum, level) => sum + level.questions.length, 0);
        const percentage = (score / totalQuestions) * 100;

        let totalTimeSeconds = 0;
        levelDurations.forEach((duration) => {
            totalTimeSeconds += duration;
        });

        // Trophy icon
        doc.setFillColor(255, 193, 7);
        doc.circle(148.5, 155, 15, 'F');
        doc.setFillColor(255, 215, 77);
        doc.circle(148.5, 155, 12, 'F');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('★', 148.5, 160, { align: 'center' });

        // Bottom info
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

        // QR Code
        try {
            const qrCodeDataUrl = await QRCode.toDataURL('https://bugaltersiz.uz', {
                width: 200,
                margin: 1,
                color: {
                    dark: '#FFFFFF',
                    light: '#0D2A57'
                }
            });
            doc.addImage(qrCodeDataUrl, 'PNG', 260, 175, 25, 25);
        } catch (error) {
            console.error('QR Code error:', error);
        }

        // Website URL
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

        // Calculate total time
        let totalTimeSeconds = 0;
        levelDurations.forEach((duration) => {
            totalTimeSeconds += duration;
        });

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 pt-20">
                <div className="max-w-2xl w-full">
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
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

                        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                            <div className="bg-slate-800/50 rounded-2xl p-4">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <CheckCircle2 className="text-green-400" size={20} />
                                    <span className="text-2xl font-bold text-white">{score}</span>
                                </div>
                                <p className="text-sm text-slate-400">To&apos;g&apos;ri</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <XCircle className="text-red-400" size={20} />
                                    <span className="text-2xl font-bold text-white">{totalQuestions - score}</span>
                                </div>
                                <p className="text-sm text-slate-400">Noto&apos;g&apos;ri</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="text-blue-400" size={20} />
                                    <span className="text-2xl font-bold text-white">{formatTime(totalTimeSeconds)}</span>
                                </div>
                                <p className="text-sm text-slate-400">Vaqt</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-4">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Layers className="text-purple-400" size={20} />
                                    <span className="text-2xl font-bold text-white">{levels.length}</span>
                                </div>
                                <p className="text-sm text-slate-400">Bosqich</p>
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
            {/* Compact Navbar */}
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
                            {/* Global Timer for registered users */}
                            {activeUser && !activeUser.isGuest && (
                                <GlobalTimer
                                    userId={activeUser.userId}
                                    variant="navbar"
                                    className="scale-90 opacity-80 hover:opacity-100 transition-opacity"
                                />
                            )}
                            {/* Exam Timer */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                                <Clock className="text-cyan-400" size={16} />
                                <span className="text-white font-mono text-sm">{formatTime(timeElapsed)}</span>
                            </div>

                            {/* Logout Button */}
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

            {/* Main Content Area */}
            <div className="flex gap-6 max-w-7xl mx-auto px-4 py-6">
                {/* Question Content */}
                <div className="flex-1">
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
                        {/* Level Badge */}
                        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-800 px-6 py-3">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Layers size={18} />
                                <span className="font-medium">{currentLevel.title}</span>
                            </div>
                        </div>

                        {/* Question Section */}
                        <div className="p-6 md:p-8">
                            {/* Question Text */}
                            <div className="mb-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-cyan-400 font-bold">{currentQuestionIndex + 1}</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed flex-1">
                                        {currentQuestion.questionText}
                                    </h2>
                                </div>
                            </div>

                            {/* Question Image */}
                            {currentQuestion.imageUrl && (
                                <div className="mb-6">
                                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50 p-4">
                                        <img
                                            src={currentQuestion.imageUrl}
                                            alt="Savol rasmi"
                                            className="w-full h-auto max-h-[400px] object-contain mx-auto"
                                            onLoad={() => {
                                                console.log('✅ Rasm muvaffaqiyatli yuklandi:', currentQuestion.imageUrl);
                                            }}
                                            onError={(e) => {
                                                console.error('❌ RASM YUKLANMADI:', currentQuestion.imageUrl);
                                                console.error('Xatolik: Rasm topilmadi yoki ochiq emas');
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                                    <div class="text-center py-8 bg-red-500/10 rounded-lg border-2 border-red-500/30">
                                                        <div class="text-red-400 mb-3 text-lg font-bold">⚠️ Rasm Yuklanmadi</div>
                                                        <div class="text-xs text-slate-400 mb-2">URL:</div>
                                                        <div class="text-xs text-slate-300 break-all px-4 mb-3 font-mono bg-slate-900 py-2 rounded">${currentQuestion.imageUrl}</div>
                                                        <div class="text-sm text-yellow-400 mb-2">📋 Tekshirish:</div>
                                                        <div class="text-xs text-slate-400 space-y-1">
                                                            <div>1. Google Drive'da rasm "Anyone with the link" ga ochiq ekanligini tekshiring</div>
                                                            <div>2. Linkni yangi tab'da ochib ko'ring</div>
                                                            <div>3. F12 bosib Console'da batafsil xatolikni ko'ring</div>
                                                        </div>
                                                    </div>
                                                `;
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Answer Options */}
                            <div className="space-y-3">
                                <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                                    <Zap size={16} className="text-cyan-400" />
                                    Javobni tanlang:
                                </p>
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option.optionId;
                                    return (
                                        <button
                                            key={option.optionId}
                                            onClick={() => handleAnswer(option.optionId)}
                                            className={`group w-full text-left p-4 border-2 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${isSelected
                                                ? 'bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-400'
                                                : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500 hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                                    ? 'border-cyan-400 bg-cyan-500'
                                                    : 'border-slate-600 group-hover:border-cyan-500'
                                                    }`}>
                                                    <span className={`text-xs font-medium ${isSelected
                                                        ? 'text-white'
                                                        : 'text-slate-500 group-hover:text-cyan-400'
                                                        }`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                </div>
                                                <span className={`text-base transition-colors leading-relaxed ${isSelected
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

                            {/* Action Buttons */}
                            <div className="mt-6 flex justify-center gap-4">
                                {selectedAnswer ? (
                                    <button
                                        onClick={handleNext}
                                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all font-medium"
                                    >
                                        Keyingi
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSkip}
                                        className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all border border-slate-600 hover:border-slate-500"
                                    >
                                        O&apos;tkazib yuborish
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Navigation Panel */}
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

            {/* Screenshot Protection */}
            {BlurOverlay}
        </div>
    );
}
