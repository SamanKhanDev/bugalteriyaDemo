'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickTest, QuickTestLevel } from '@/lib/schema';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Layers, Clock, CheckCircle } from 'lucide-react';
import { use } from 'react';

export default function PreviewQuickTestPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = use(params);
    const router = useRouter();
    const [test, setTest] = useState<QuickTest | null>(null);
    const [levels, setLevels] = useState<QuickTestLevel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTest();
    }, [testId]);

    const loadTest = async () => {
        try {
            const testDoc = await getDoc(doc(db, 'quickTests', testId));
            if (testDoc.exists()) {
                setTest({ ...testDoc.data(), testId: testDoc.id } as QuickTest);
            }

            const levelsSnapshot = await getDocs(
                query(collection(db, 'quickTests', testId, 'levels'), orderBy('levelNumber'))
            );
            const levelsData = levelsSnapshot.docs.map(doc => ({
                ...doc.data(),
                levelId: doc.id
            })) as QuickTestLevel[];
            setLevels(levelsData);
        } catch (error) {
            console.error('Error loading test:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Yuklanmoqda...</div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="text-center text-slate-400 py-12">
                Imtihon topilmadi
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white">{test.title}</h1>
                    <p className="text-slate-400">Ko'rib chiqish</p>
                </div>
            </div>

            {/* Test Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                            <Layers className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{test.totalLevels}</p>
                            <p className="text-sm text-slate-400">Bosqich</p>
                        </div>
                    </div>

                    {test.timeLimit && (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Clock className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{Math.floor(test.timeLimit / 60)}</p>
                                <p className="text-sm text-slate-400">Daqiqa</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${test.isActive ? 'bg-green-500/10' : 'bg-slate-700/50'} rounded-xl flex items-center justify-center`}>
                            <CheckCircle className={test.isActive ? 'text-green-400' : 'text-slate-500'} size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{test.isActive ? 'Faol' : 'Nofaol'}</p>
                            <p className="text-sm text-slate-400">Holat</p>
                        </div>
                    </div>
                </div>

                {test.description && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <p className="text-slate-300">{test.description}</p>
                    </div>
                )}
            </div>

            {/* Levels */}
            <div className="space-y-4">
                {levels.map((level, levelIdx) => (
                    <div key={level.levelId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{level.title}</h2>
                            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm">
                                {level.questions.length} savol
                            </span>
                        </div>

                        <div className="space-y-6">
                            {level.questions.map((question, qIdx) => (
                                <div key={question.questionId} className="bg-slate-800/50 rounded-xl p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-cyan-400 font-bold">{qIdx + 1}</span>
                                        </div>
                                        <p className="text-lg text-white flex-1">{question.questionText}</p>
                                    </div>

                                    <div className="space-y-2 ml-12">
                                        {question.options.map((option, optIdx) => (
                                            <div
                                                key={option.optionId}
                                                className={`flex items-center gap-3 p-3 rounded-lg ${option.isCorrect
                                                        ? 'bg-green-500/10 border border-green-500/20'
                                                        : 'bg-slate-900/50 border border-slate-700'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${option.isCorrect
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </div>
                                                <span className={option.isCorrect ? 'text-green-400' : 'text-slate-300'}>
                                                    {option.text}
                                                </span>
                                                {option.isCorrect && (
                                                    <CheckCircle className="text-green-400 ml-auto" size={16} />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {question.explanation && (
                                        <div className="mt-4 ml-12 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-sm text-blue-400">
                                                <strong>Tushuntirish:</strong> {question.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
