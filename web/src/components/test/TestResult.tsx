'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface TestResultProps {
    score: number;
    totalQuestions: number;
    passed: boolean;
    onRetry: () => void;
}

export default function TestResult({ score, totalQuestions, passed, onRetry }: TestResultProps) {
    const router = useRouter();
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="mb-6 flex justify-center">
                {passed ? (
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle size={48} />
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                        <XCircle size={48} />
                    </div>
                )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
                {passed ? 'Tabriklaymiz!' : 'Afsuski, o\'tmadingiz'}
            </h2>

            <p className="text-slate-400 mb-8">
                {passed
                    ? 'Siz ushbu bosqichdan muvaffaqiyatli o\'tdingiz.'
                    : 'Keyingi bosqichga o\'tish uchun kamida 80% to\'plashingiz kerak.'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase font-bold mb-1">Natija</div>
                    <div className={`text-2xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                        {percentage}%
                    </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase font-bold mb-1">To'g'ri javoblar</div>
                    <div className="text-2xl font-bold text-white">
                        {score}/{totalQuestions}
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                {!passed && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                        <RotateCcw size={20} />
                        Qayta ishlash
                    </button>
                )}

                <button
                    onClick={() => router.push('/dashboard')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${passed
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                >
                    {passed ? 'Keyingi bosqich' : 'Dashboardga qaytish'}
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
