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
    imageUrl?: string;
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

    const findNextUnansweredIndex = (startIndex: number): number => {
        // First check from next index to end
        for (let i = startIndex + 1; i < questions.length; i++) {
            if (!selectedOptions[questions[i].id]) return i;
        }
        // Then check from start to current index
        for (let i = 0; i <= startIndex; i++) {
            if (!selectedOptions[questions[i].id]) return i;
        }
        return -1;
    };

    const handleOptionSelect = (optionId: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));
    };

    const handleNext = () => {
        const nextIndex = findNextUnansweredIndex(currentQuestionIndex);
        if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            handleSubmit();
        }
    };

    const handleSkip = () => {
        const nextIndex = findNextUnansweredIndex(currentQuestionIndex);
        if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            if (nextIndex === currentQuestionIndex) {
                // Only one question left and user wants to skip. Stay here.
                alert("Siz boshqa barcha savollarga javob berdingiz.");
            }
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
                    setResult(null);
                    setCurrentQuestionIndex(0);
                    setSelectedOptions({});
                }}
            />
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4">
            {/* Progress Bar */}
            <div className="mb-6 sm:mb-8">
                <div className="flex justify-between text-xs sm:text-sm text-slate-400 mb-2 px-1">
                    <span>Savol {currentQuestionIndex + 1} / {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl min-h-[350px] sm:min-h-[400px] flex flex-col">
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-6 sm:mb-8 leading-relaxed">
                    {currentQuestion.questionText}
                </h2>

                {/* Question Image */}
                {currentQuestion.imageUrl && (
                    <div className="mb-6 p-2 sm:p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <img
                            src={currentQuestion.imageUrl}
                            alt="Savol rasmi"
                            className="max-w-full h-auto rounded-lg mx-auto max-h-[250px] sm:max-h-[400px] object-contain"
                            onLoad={(e) => {
                                console.log('✅ Rasm yuklandi:', currentQuestion.imageUrl);
                            }}
                            onError={(e) => {
                                console.error('❌ Rasm yuklanmadi:', currentQuestion.imageUrl);
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                        <div class="text-center py-4 sm:py-8">
                                            <div class="text-red-400 mb-2 text-sm sm:text-base">⚠️ Rasm yuklanmadi</div>
                                            <div class="text-[10px] text-slate-500 break-all px-2 font-mono">${currentQuestion.imageUrl}</div>
                                        </div>
                                    `;
                                }
                            }}
                        />
                    </div>
                )}

                <div className="space-y-3 sm:space-y-4 flex-1">
                    {currentQuestion.options.map((option) => {
                        const isSelected = selectedOptions[currentQuestion.id] === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(option.id)}
                                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all group flex items-start sm:items-center gap-3 sm:gap-4 ${isSelected
                                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 transition-colors ${isSelected ? 'border-cyan-500' : 'border-slate-600 group-hover:border-slate-500'
                                    }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-cyan-500 rounded-full" />}
                                </div>
                                <span className="font-medium text-sm sm:text-base">{option.text}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-between gap-3">
                    {/* O'tkazib yuborish tugmasi */}
                    {!selectedOptions[currentQuestion.id] && !isSubmitting && (
                        <button
                            onClick={handleSkip}
                            className="px-4 py-2 sm:px-6 sm:py-4 text-slate-400 hover:text-white font-medium transition-colors text-sm sm:text-base text-center sm:text-left"
                        >
                            O'tkazib yuborish
                        </button>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={!selectedOptions[currentQuestion.id] || isSubmitting}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none w-full sm:w-auto ml-auto"
                    >
                        {isSubmitting ? 'Yuklanmoqda...' : (
                            questions.length - Object.keys(selectedOptions).length <= 1 ? 'Yakunlash' : 'Next'
                        )}
                        {!isSubmitting && <ChevronRight size={20} className="sm:w-6 sm:h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
