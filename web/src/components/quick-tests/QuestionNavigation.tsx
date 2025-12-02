'use client';

import { Layers } from 'lucide-react';

interface Answer {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
}

interface QuestionNavigationProps {
    levels: any[];
    answers: Answer[];
    currentLevelIndex: number;
    currentQuestionIndex: number;
    onNavigate: (levelIdx: number, questionIdx: number) => void;
}

export function QuestionNavigation({
    levels,
    answers,
    currentLevelIndex,
    currentQuestionIndex,
    onNavigate
}: QuestionNavigationProps) {
    return (
        <div className="hidden lg:block w-80">
            <div className="sticky top-24 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-cyan-400" />
                    Savollar
                </h3>

                <div className="space-y-6">
                    {levels.map((level, levelIdx) => {
                        const levelStartIdx = levels.slice(0, levelIdx).reduce((sum, l) => sum + l.questions.length, 0);

                        return (
                            <div key={level.levelId} className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
                                    <div className="h-4 w-1 bg-cyan-500 rounded-full"></div>
                                    {level.title}
                                </div>

                                <div className="grid grid-cols-5 gap-2">
                                    {level.questions.map((question: any, qIdx: number) => {
                                        const globalQuestionIdx = levelStartIdx + qIdx;
                                        const isAnswered = answers.some(a => a.questionId === question.questionId);
                                        const isCurrent = currentLevelIndex === levelIdx && currentQuestionIndex === qIdx;

                                        return (
                                            <button
                                                key={question.questionId}
                                                onClick={() => onNavigate(levelIdx, qIdx)}
                                                className={`
                                                    w-full aspect-square rounded-lg font-bold text-sm transition-all
                                                    ${isCurrent
                                                        ? 'bg-cyan-500 text-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-110'
                                                        : isAnswered
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                                                    }
                                                `}
                                            >
                                                {globalQuestionIdx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500"></div>
                        <span className="text-slate-400">Joriy savol</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-green-500/20 border border-green-500/30"></div>
                        <span className="text-slate-400">Javob berilgan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700"></div>
                        <span className="text-slate-400">Javob berilmagan</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
