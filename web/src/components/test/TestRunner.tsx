'use client';

import { useState } from 'react';
import { Question, Option } from '@/lib/schema';
import { doc, updateDoc, increment, arrayUnion, setDoc, getDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import TestResult from './TestResult';
import { ChevronRight } from 'lucide-react';

interface QuestionWithOptions extends Question {
    id: string;
    options: (Option & { id: string })[];
}

interface TestRunnerProps {
    stageId: string;
    questions: QuestionWithOptions[];
    passPercentage?: number;
}

export default function TestRunner({ stageId, questions, passPercentage = 75 }: TestRunnerProps) {
    const { user } = useStore();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

    if (!questions || questions.length === 0) {
        return <div className="text-center text-slate-400">Savollar mavjud emas.</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleOptionSelect = (optionId: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!user || isSubmitting) return;
        setIsSubmitting(true);

        try {
            let correctCount = 0;
            let wrongCount = 0;

            // Calculate score
            questions.forEach(q => {
                const selectedOptionId = selectedOptions[q.id];
                const correctOption = q.options.find(o => o.isCorrect);

                if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
            });

            const scorePercentage = (correctCount / questions.length) * 100;
            const passed = scorePercentage >= passPercentage;

            // Update Firestore with best score tracking
            const progressRef = doc(db, 'userProgress', user.userId);
            const progressSnap = await getDoc(progressRef);

            if (!progressSnap.exists()) {
                // First time - create document
                await setDoc(progressRef, {
                    userId: user.userId,
                    completedStages: passed ? [stageId] : [],
                    totalCorrect: correctCount,
                    totalWrong: wrongCount,
                    perStage: {
                        [stageId]: {
                            completed: passed,
                            correctCount,
                            wrongCount,
                            lastAttempt: new Date().toISOString()
                        }
                    }
                });
            } else {
                // Get previous attempt
                const currentProgress = progressSnap.data();
                const previousAttempt = currentProgress.perStage?.[stageId];
                const previousCorrect = previousAttempt?.correctCount || 0;
                const previousWrong = previousAttempt?.wrongCount || 0;

                // Calculate difference for totals
                const correctDiff = correctCount - previousCorrect;
                const wrongDiff = wrongCount - previousWrong;

                const updateData: any = {
                    [`perStage.${stageId}`]: {
                        completed: passed,
                        correctCount,
                        wrongCount,
                        lastAttempt: new Date().toISOString()
                    }
                };

                // Update totals based on difference
                if (correctDiff !== 0) {
                    updateData.totalCorrect = increment(correctDiff);
                }
                if (wrongDiff !== 0) {
                    updateData.totalWrong = increment(wrongDiff);
                }

                if (passed) {
                    updateData.completedStages = arrayUnion(stageId);
                }

                await updateDoc(progressRef, updateData);
            }

            // ---------------------------------------------------------
            // Check for Certificate Eligibility (Auto-Issuance)
            // ---------------------------------------------------------
            try {
                // 1. Get fresh progress data
                const freshProgressSnap = await getDoc(progressRef);
                const freshProgress = freshProgressSnap.data();

                if (freshProgress) {
                    const completedStagesCount = freshProgress.completedStages?.length || 0;

                    // 2. Get total stages count
                    const stagesSnap = await getDocs(collection(db, 'testStages'));
                    const totalStages = stagesSnap.size;

                    console.log(`📊 Progress Check: ${completedStagesCount}/${totalStages} stages`);

                    // 3. Check if all stages completed
                    if (completedStagesCount >= totalStages && totalStages > 0) {
                        const totalCorrect = freshProgress.totalCorrect || 0;
                        const totalWrong = freshProgress.totalWrong || 0;
                        const totalQuestions = totalCorrect + totalWrong;

                        // 4. Calculate percentage
                        const percentage = totalQuestions > 0
                            ? (totalCorrect / totalQuestions) * 100
                            : 0;

                        console.log(`🎯 Score Check: ${percentage.toFixed(1)}% (Required: 80%)`);

                        if (percentage >= 80) {
                            // 5. Check if already has certificate
                            const certQuery = query(
                                collection(db, 'certificates'),
                                where('userId', '==', user.userId)
                            );
                            const certSnap = await getDocs(certQuery);

                            if (certSnap.empty) {
                                console.log('🏆 Eligible! Issuing certificate...');

                                const certificateNumber = `CERT-${Date.now()}-${user.userId.substring(0, 6).toUpperCase()}`;
                                const certRef = await addDoc(collection(db, 'certificates'), {
                                    userId: user.userId,
                                    userName: user.name,
                                    issuedAt: new Date(),
                                    issuedBy: 'system', // Auto-issued
                                    certificateNumber,
                                    completionDate: new Date(),
                                    totalStages: totalStages,
                                    totalScore: totalCorrect
                                });

                                // Create notification
                                await addDoc(collection(db, 'notifications'), {
                                    userId: user.userId,
                                    type: 'certificate',
                                    title: 'Sertifikat berildi!',
                                    message: `Tabriklaymiz! Siz kursni ${percentage.toFixed(1)}% natija bilan yakunladingiz va sertifikatga ega bo'ldingiz.`,
                                    link: `/certificate/${certRef.id}?action=download`,
                                    read: false,
                                    createdAt: new Date()
                                });

                                alert(`Tabriklaymiz! Siz kursni muvaffaqiyatli tugatdingiz (${percentage.toFixed(1)}%). Sizga sertifikat berildi!`);
                            } else {
                                console.log('ℹ️ User already has a certificate.');
                            }
                        }
                    }
                }
            } catch (certError) {
                console.error('Error checking certificate eligibility:', certError);
                // Don't block the user if this fails, just log it
            }
            // ---------------------------------------------------------

            setResult({ score: correctCount, passed });
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Xatolik yuz berdi. Qayta urinib ko\'ring.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (result) {
        return (
            <TestResult
                score={result.score}
                totalQuestions={questions.length}
                passed={result.passed}
                onRetry={() => {
                    setResult(null);
                    setCurrentQuestionIndex(0);
                    setSelectedOptions({});
                }}
            />
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Savol {currentQuestionIndex + 1} / {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl min-h-[400px] flex flex-col">
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed">
                    {currentQuestion.questionText}
                </h2>

                <div className="space-y-4 flex-1">
                    {currentQuestion.options.map((option) => {
                        const isSelected = selectedOptions[currentQuestion.id] === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(option.id)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all group flex items-center gap-4 ${isSelected
                                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-cyan-500' : 'border-slate-600 group-hover:border-slate-500'
                                    }`}>
                                    {isSelected && <div className="w-3 h-3 bg-cyan-500 rounded-full" />}
                                </div>
                                <span className="font-medium">{option.text}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!selectedOptions[currentQuestion.id] || isSubmitting}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isSubmitting ? 'Yuklanmoqda...' : (
                            currentQuestionIndex === questions.length - 1 ? 'Yakunlash' : 'Keyingi'
                        )}
                        {!isSubmitting && <ChevronRight size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
