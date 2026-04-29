'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CaseStudy, CaseStudyResult, CaseStudyQuestion } from '@/lib/schema';
import { Trophy, Clock, Target, Filter, Search, Eye, X, CheckCircle2, Calendar, Download, FileText, User, MessageSquare, Check, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { use } from 'react';

interface ResultWithUser extends CaseStudyResult {
    userName: string;
}

export default function CaseStudyResultsPage({ params }: { params: Promise<{ caseId: string }> }) {
    const { caseId } = use(params);
    const [caseItem, setCaseItem] = useState<CaseStudy | null>(null);
    const [questions, setQuestions] = useState<CaseStudyQuestion[]>([]);
    const [results, setResults] = useState<ResultWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingResult, setViewingResult] = useState<ResultWithUser | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('all');
    const [gradingResult, setGradingResult] = useState<ResultWithUser | null>(null);
    const [newScore, setNewScore] = useState<string>('');

    useEffect(() => {
        loadData();
    }, [caseId]);

    const loadData = async () => {
        try {
            const caseDoc = await getDoc(doc(db, 'caseStudies', caseId));
            if (caseDoc.exists()) {
                setCaseItem({ ...caseDoc.data(), caseId: caseDoc.id } as CaseStudy);
            }

            const questionsSnapshot = await getDocs(
                query(collection(db, 'caseStudies', caseId, 'questions'))
            );
            const questionsData = questionsSnapshot.docs.map(doc => ({
                ...doc.data(),
                questionId: doc.id
            })) as CaseStudyQuestion[];
            setQuestions(questionsData);

            const resultsSnapshot = await getDocs(
                query(collection(db, 'caseStudyResults'), where('caseId', '==', caseId), orderBy('completedAt', 'desc'))
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

    const getLocalFormattedDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const availableDates = Array.from(new Set(results.map(r => {
        if (!r.completedAt) return null;
        try {
            return getLocalFormattedDate(r.completedAt.toDate());
        } catch (e) {
            return null;
        }
    }))).filter(Boolean).sort((a: any, b: any) => b.localeCompare(a)) as string[];

    const filteredResults = results.filter(r => {
        const matchesSearch = r.userName.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesDate = true;
        if (selectedDate !== 'all') {
            try {
                matchesDate = getLocalFormattedDate(r.completedAt.toDate()) === selectedDate;
            } catch (e) {
                matchesDate = false;
            }
        }
        return matchesSearch && matchesDate;
    });

    const stats = {
        totalParticipants: new Set(results.map(r => r.userId)).size,
        totalAttempts: results.length,
        averageTime: results.length > 0
            ? results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / results.length
            : 0,
        gradedCount: results.filter(r => r.status === 'graded').length
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleGrade = async () => {
        if (!gradingResult || !newScore) return;
        try {
            await updateDoc(doc(db, 'caseStudyResults', gradingResult.resultId), {
                score: parseInt(newScore),
                status: 'graded',
                updatedAt: Timestamp.now()
            });
            setResults(prev => prev.map(r => r.resultId === gradingResult.resultId ? { ...r, score: parseInt(newScore), status: 'graded' } : r));
            setGradingResult(null);
            setNewScore('');
            alert('Ball muvaffaqiyatli saqlandi!');
        } catch (error) {
            console.error('Error grading:', error);
            alert('Xatolik yuz berdi');
        }
    };

    const exportToExcel = () => {
        const rows = filteredResults.map((result, index) => {
            let completedAtStr = '';
            try {
                completedAtStr = result.completedAt.toDate().toLocaleString('uz-UZ');
            } catch (_) {}

            return {
                '№': index + 1,
                'Foydalanuvchi': result.userName,
                'Ball': result.score ?? 'Baholanmagan',
                'Status': result.status === 'graded' ? 'Baholangan' : 'Topshirilgan',
                'Sarflangan vaqt': formatTime(result.timeSpentSeconds),
                'Topshirilgan vaqt': completedAtStr,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Keys Natijalari');
        XLSX.writeFile(workbook, `Keys_${caseItem?.title || 'natijalar'}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Yuklanmoqda...</div>
            </div>
        );
    }

    if (!caseItem) {
        return <div className="text-center text-slate-400 py-12">Keys topilmadi</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{caseItem.title}</h1>
                    <p className="text-slate-400">Natijalar va Ishtirokchilar Faolligi</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm font-semibold transition-all"
                >
                    <Download size={16} />
                    Excel yuklab olish
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <User className="text-amber-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalParticipants}</div>
                    </div>
                    <div className="text-sm text-slate-400">Ishtirokchilar</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Target className="text-blue-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.totalAttempts}</div>
                    </div>
                    <div className="text-sm text-slate-400">Jami Urinishlar</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <Clock className="text-purple-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white">{formatTime(Math.floor(stats.averageTime))}</div>
                    </div>
                    <div className="text-sm text-slate-400">O'rtacha Vaqt</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="text-green-400" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.gradedCount}</div>
                    </div>
                    <div className="text-sm text-slate-400">Baholangan</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Foydalanuvchi qidirish..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-slate-400" />
                        <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        >
                            <option value="all">Barcha kunlar</option>
                            {availableDates.map(date => (
                                <option key={date} value={date}>{date}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-slate-800">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Foydalanuvchi</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ball</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vaqt</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Topshirilgan</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredResults.map((result) => (
                                <tr key={result.resultId} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{result.userName}</div>
                                        <div className="text-xs text-slate-500">{result.userId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {result.status === 'graded' ? (
                                            <span className="text-xl font-bold text-amber-500">{result.score}</span>
                                        ) : (
                                            <span className="text-slate-500 italic text-sm">Baholanmagan</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                                        {formatTime(result.timeSpentSeconds)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${result.status === 'graded' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {result.status === 'graded' ? 'Baholangan' : 'Topshirilgan'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {result.completedAt?.toDate().toLocaleString('uz-UZ')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setViewingResult(result)}
                                                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                                title="Ko'rish"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setGradingResult(result);
                                                    setNewScore(result.score?.toString() || '');
                                                }}
                                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                                                title="Baholash"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {viewingResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white">{viewingResult.userName}</h2>
                                <p className="text-sm text-slate-400">Javoblar tafsiloti</p>
                            </div>
                            <button onClick={() => setViewingResult(null)} className="p-2 text-slate-400 hover:text-white rounded-lg"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {questions.map((q, idx) => {
                                const answer = viewingResult.answers.find(a => a.questionId === q.questionId);
                                return (
                                    <div key={q.questionId} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
                                        <div className="flex gap-3">
                                            <span className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</span>
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium mb-2">{q.questionText}</h4>
                                                {q.imageUrl && <img src={q.imageUrl} alt="Savol rasmi" className="max-w-full h-auto rounded-lg mb-4 border border-slate-700" />}
                                                
                                                <div className="bg-slate-900/80 rounded-xl p-4 border-l-4 border-amber-500">
                                                    <div className="text-xs text-amber-500 font-bold uppercase mb-2 flex items-center gap-2">
                                                        <MessageSquare size={12} />
                                                        Foydalanuvchi javobi:
                                                    </div>
                                                    <p className="text-slate-200 whitespace-pre-wrap">{answer?.answerText || 'Javob berilmagan'}</p>
                                                </div>

                                                {q.sampleAnswer && (
                                                    <div className="mt-4 bg-green-500/5 rounded-xl p-4 border-l-4 border-green-500/30">
                                                        <div className="text-xs text-green-500 font-bold uppercase mb-2 flex items-center gap-2">
                                                            <Check size={12} />
                                                            Namuna javob:
                                                        </div>
                                                        <p className="text-slate-400 text-sm whitespace-pre-wrap">{q.sampleAnswer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Grading Modal */}
            {gradingResult && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1">{gradingResult.userName}</h3>
                            <p className="text-sm text-slate-400">Keysni baholash</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Ball (0-100)</label>
                                <input
                                    type="number"
                                    value={newScore}
                                    onChange={(e) => setNewScore(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-amber-500"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setGradingResult(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Bekor qilish</button>
                            <button onClick={handleGrade} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all">Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
