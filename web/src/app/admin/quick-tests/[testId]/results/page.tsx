'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickTest, QuickTestResult, QuickTestLevel } from '@/lib/schema';
import { Trophy, Clock, Target, Filter, Search, Eye, X, CheckCircle2, XCircle } from 'lucide-react';
import { use } from 'react';

interface ResultWithUser extends QuickTestResult {
    userName: string;
}

export default function QuickTestResultsPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = use(params);
    const [test, setTest] = useState<QuickTest | null>(null);
    const [levels, setLevels] = useState<QuickTestLevel[]>([]);
    const [results, setResults] = useState<ResultWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
    const [sortBy, setSortBy] = useState<'score' | 'time'>('score');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingResult, setViewingResult] = useState<ResultWithUser | null>(null);

    useEffect(() => {
        loadData();
    }, [testId]);

    const loadData = async () => {
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

            const resultsSnapshot = await getDocs(
                query(collection(db, 'quickTestResults'), where('testId', '==', testId))
            );
            const resultsData = resultsSnapshot.docs.map(doc => ({
                ...doc.data(),
                resultId: doc.id
            })) as ResultWithUser[];
            setResults(resultsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processResults = () => {
        const userMap = new Map<string, {
            bestResults: Map<string, ResultWithUser>,
            userName: string,
            userId: string
        }>();

        results.forEach(result => {
            if (!userMap.has(result.userId)) {
                userMap.set(result.userId, {
                    bestResults: new Map(),
                    userName: result.userName,
                    userId: result.userId
                });
            }

            const userData = userMap.get(result.userId)!;
            const existingBest = userData.bestResults.get(result.levelId);
            if (!existingBest || result.score > existingBest.score) {
                userData.bestResults.set(result.levelId, result);
            }
        });

        if (selectedLevel === 'all') {
            return Array.from(userMap.values()).map(user => {
                let totalScore = 0;
                let totalQuestions = 0;
                let totalTime = 0;
                const allAnswers: any[] = [];

                user.bestResults.forEach(r => {
                    totalScore += r.score;
                    totalQuestions += r.totalQuestions;
                    totalTime += r.timeSpentSeconds;
                    if (r.answers) {
                        allAnswers.push(...r.answers);
                    }
                });

                return {
                    resultId: user.userId,
                    userId: user.userId,
                    userName: user.userName,
                    score: totalScore,
                    totalQuestions,
                    timeSpentSeconds: totalTime,
                    levelNumber: 0,
                    testId,
                    levelId: '',
                    answers: allAnswers,
                    completedAt: { toDate: () => new Date() } as any
                };
            });
        } else {
            return Array.from(userMap.values())
                .map(user => {
                    const bestForLevel = Array.from(user.bestResults.values()).find(r => r.levelNumber === selectedLevel);
                    return bestForLevel || null;
                })
                .filter(Boolean) as ResultWithUser[];
        }
    };

    const sortedResults = processResults()
        .filter(result =>
            result.userName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'score') {
                if (b.score !== a.score) return b.score - a.score;
                return a.timeSpentSeconds - b.timeSpentSeconds;
            } else {
                return a.timeSpentSeconds - b.timeSpentSeconds;
            }
        });

    const totalAttempts = results.filter(r => r.levelNumber === 1).length;
    const stats = {
        totalParticipants: new Set(results.map(r => r.userId)).size,
        totalAttempts: totalAttempts,
        averageScore: totalAttempts > 0
            ? results.reduce((sum, r) => sum + r.score, 0) / totalAttempts
            : 0,
        averageTime: totalAttempts > 0
            ? results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / totalAttempts
            : 0
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getRankBadge = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
                <p className="text-slate-400">Natijalar va Reyting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <Trophy className="text-cyan-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalParticipants}</div>
                    </div>
                    <div className="text-sm text-slate-400">Ishtirokchilar</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Target className="text-blue-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalAttempts}</div>
                    </div>
                    <div className="text-sm text-slate-400">Jami Urinishlar</div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Trophy className="text-green-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white flex items-center gap-1">
                            {stats.averageScore.toFixed(1)} <span className="text-yellow-400 text-lg">⭐</span>
                        </div>
                    </div>
                    <div className="text-sm text-slate-400">O'rtacha Ball</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Clock className="text-purple-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white">{formatTime(Math.floor(stats.averageTime))}</div>
                    </div>
                    <div className="text-sm text-slate-400">O'rtacha Vaqt</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="text-slate-400" size={20} />
                        <span className="text-slate-300 font-medium">Filtrlash:</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">Bosqich:</label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="all">Barcha bosqichlar</option>
                            {levels.map(level => (
                                <option key={level.levelId} value={level.levelNumber}>
                                    {level.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">Saralash:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'score' | 'time')}
                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="score">Ball bo'yicha</option>
                            <option value="time">Vaqt bo'yicha</option>
                        </select>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Foydalanuvchi nomini qidirish..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {sortedResults.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        Hali natijalar yo'q
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reyting</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Foydalanuvchi</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bosqich</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Ball</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">To'g'ri</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Vaqt</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {sortedResults.map((result, index) => {
                                    const percentage = (result.score / result.totalQuestions) * 100;

                                    return (
                                        <tr key={result.resultId} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-2xl">{getRankBadge(index)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{result.userName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {result.levelNumber === 0 ? (
                                                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium">
                                                        Barcha bosqichlar
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium">
                                                        {levels.find(l => l.levelNumber === result.levelNumber)?.title || `${result.levelNumber}-bosqich`}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold text-white">{result.score}</span>
                                                    <span className="text-yellow-400 text-xl">⭐</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-300">
                                                    {result.score}/{result.totalQuestions}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Clock size={16} className="text-slate-500" />
                                                    {formatTime(result.timeSpentSeconds)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setViewingResult(result)}
                                                    className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                                    title="Batafsil ko'rish"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {viewingResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    {viewingResult.userName} - Natijalar
                                </h2>
                                <p className="text-sm text-slate-400">
                                    {viewingResult.score} ball • {formatTime(viewingResult.timeSpentSeconds)}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingResult(null)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {viewingResult.answers && viewingResult.answers.length > 0 ? (
                                <div className="space-y-4">
                                    {levels.map(level => {
                                        const levelQuestions = level.questions;
                                        // Check if there are any answers for this level's questions
                                        const questionsWithAnswers = levelQuestions.filter(q =>
                                            viewingResult.answers?.some(a => a.questionId === q.questionId)
                                        );

                                        if (questionsWithAnswers.length === 0) return null;

                                        return (
                                            <div key={level.levelId} className="mb-8 last:mb-0">
                                                <div className="flex items-center gap-2 mb-4 sticky top-0 bg-slate-900 py-2 z-10 border-b border-slate-800">
                                                    <div className="h-6 w-1 bg-cyan-500 rounded-full"></div>
                                                    <h3 className="text-lg font-bold text-white">{level.title}</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {questionsWithAnswers.map((question, idx) => {
                                                        const answer = viewingResult.answers?.find(a => a.questionId === question.questionId);
                                                        if (!answer) return null;

                                                        const selectedOption = question.options.find(o => o.optionId === answer.selectedOptionId);
                                                        const correctOption = question.options.find(o => o.isCorrect);
                                                        const isCorrect = answer.isCorrect;

                                                        return (
                                                            <div key={question.questionId} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                                <div className="flex gap-3">
                                                                    <span className="text-slate-500 font-mono">{idx + 1}.</span>
                                                                    <div className="flex-1 space-y-3">
                                                                        <p className="text-white font-medium">
                                                                            {question.questionText}
                                                                        </p>

                                                                        {question.imageUrl && (
                                                                            <img
                                                                                src={question.imageUrl}
                                                                                alt="Savol rasmi"
                                                                                className="max-w-full max-h-64 rounded-lg border border-slate-700"
                                                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                                                            />
                                                                        )}

                                                                        <div className="space-y-2 text-sm">
                                                                            <div className={`flex items-center gap-2 p-2 rounded-lg ${isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                                {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                                                                <span className="font-medium">Javob: {selectedOption?.text || 'Belgilanmagan'}</span>
                                                                            </div>

                                                                            {!isCorrect && (
                                                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-400">
                                                                                    <CheckCircle2 size={16} />
                                                                                    <span className="font-medium">To'g'ri javob: {correctOption?.text}</span>
                                                                                </div>
                                                                            )}

                                                                            {question.explanation && (
                                                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                                    <p className="text-xs font-semibold mb-1">Tushuntirish:</p>
                                                                                    <p className="text-sm">{question.explanation}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-12">Javoblar topilmadi</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
