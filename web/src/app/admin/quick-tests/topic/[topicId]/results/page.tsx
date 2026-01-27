'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickTest, QuickTestResult, QuickTestTopic } from '@/lib/schema';
import { ArrowLeft, Trophy, Search, FileText, Calendar, Download, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useParams } from 'next/navigation';

interface AggregatedUserResult {
    userId: string;
    userName: string;
    totalScore: number;
    completedTests: number;
    results: {
        [testId: string]: {
            score: number;
            date: any;
        }
    };
}

export default function TopicResultsPage() {
    const params = useParams();
    const topicId = params?.topicId as string;

    const [topic, setTopic] = useState<QuickTestTopic | null>(null);
    const [tests, setTests] = useState<QuickTest[]>([]);
    const [aggregatedResults, setAggregatedResults] = useState<AggregatedUserResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    useEffect(() => {
        if (!topicId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Topic
                const topicRef = doc(db, 'quickTestTopics', topicId);
                const topicSnap = await getDoc(topicRef);
                if (!topicSnap.exists()) {
                    setLoading(false);
                    return;
                }
                const topicData = { ...topicSnap.data(), topicId: topicSnap.id } as QuickTestTopic;
                setTopic(topicData);

                // 2. Fetch Tests in Topic
                const qTests = query(collection(db, 'quickTests'), where('topicId', '==', topicId));
                const testsSnap = await getDocs(qTests);
                const testsData = testsSnap.docs.map(d => ({ ...d.data(), testId: d.id } as QuickTest));
                setTests(testsData);

                if (testsData.length === 0) {
                    setLoading(false);
                    return;
                }

                // 3. Fetch Results
                const allResults: QuickTestResult[] = [];

                // Fetch for individual child tests (Legacy)
                const fetchPromises = testsData.map(async (test) => {
                    const qResults = query(collection(db, 'quickTestResults'), where('testId', '==', test.testId));
                    const snap = await getDocs(qResults);
                    snap.forEach(doc => allResults.push({ ...doc.data(), resultId: doc.id } as QuickTestResult));
                });

                // Fetch for the Topic itself (Unified Mode)
                const topicResultsQuery = query(collection(db, 'quickTestResults'), where('testId', '==', topicId));
                const topicPromise = getDocs(topicResultsQuery).then(snap => {
                    snap.forEach(doc => allResults.push({ ...doc.data(), resultId: doc.id } as QuickTestResult));
                });

                await Promise.all([...fetchPromises, topicPromise]);


                // 4. Aggregate Results
                type LevelResult = { score: number, date: any };
                type TestMap = Map<string, LevelResult>;
                type UserMapData = {
                    userId: string;
                    userName: string;
                    rawScores: Map<string, TestMap>;
                };

                const userMap = new Map<string, UserMapData>();

                allResults.forEach(result => {
                    const userId = result.userId;
                    const userName = result.userName || (result as any).userFullName || 'Noma\'lum';
                    const score = result.score || 0;
                    const testId = result.testId;
                    const levelId = result.levelId || 'default-level';
                    const date = result.completedAt || (result as any).createdAt || null;

                    if (!userId) return;

                    if (!userMap.has(userId)) {
                        userMap.set(userId, {
                            userId,
                            userName,
                            rawScores: new Map()
                        });
                    }

                    const userData = userMap.get(userId)!;

                    let testScores = userData.rawScores.get(testId);
                    if (!testScores) {
                        testScores = new Map();
                        userData.rawScores.set(testId, testScores);
                    }

                    const existingLevel = testScores.get(levelId);
                    if (!existingLevel || score > existingLevel.score) {
                        testScores.set(levelId, { score, date });
                    }
                });

                // Convert to final array
                const finalResults: AggregatedUserResult[] = [];

                for (const user of userMap.values()) {
                    let totalScore = 0;
                    let completedTestsCount = 0;
                    let hasUnifiedResult = false;
                    const resultsObj: { [testId: string]: { score: number, date: any } } = {};

                    for (const [tId, levelsMap] of user.rawScores) {
                        let testTotalScore = 0;
                        let latestDate = null;

                        for (const [lvlId, data] of levelsMap) {
                            testTotalScore += data.score;
                            if (!latestDate || (data.date && data.date > latestDate)) {
                                latestDate = data.date;
                            }
                        }

                        resultsObj[tId] = {
                            score: testTotalScore,
                            date: latestDate
                        };

                        if (tId === topicId) {
                            totalScore += testTotalScore;
                            hasUnifiedResult = true;
                        } else if (testsData.some(t => t.testId === tId)) {
                            totalScore += testTotalScore;
                            completedTestsCount += 1;
                        } else {
                            // Stray results? Add to total anyway
                            totalScore += testTotalScore;
                        }
                    }

                    if (hasUnifiedResult) {
                        completedTestsCount = testsData.length;
                    }

                    finalResults.push({
                        userId: user.userId,
                        userName: user.userName,
                        totalScore,
                        completedTests: completedTestsCount,
                        results: resultsObj
                    });
                }

                finalResults.sort((a, b) => b.totalScore - a.totalScore);
                setAggregatedResults(finalResults);

            } catch (error) {
                console.error("Error loading results:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [topicId]);

    const filteredResults = aggregatedResults.filter(user =>
        user.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = () => {
        if (!topic) return;

        const data = filteredResults.map((user, index) => {
            const row: any = {
                'O\'rin': index + 1,
                'F.I.SH': user.userName,
                'Jami Ball': user.totalScore,
                'Status': user.completedTests === tests.length ? 'Yakunlangan' : `${user.completedTests}/${tests.length}`
            };

            // Unified Result
            if (user.results[topic.topicId]) {
                row['Umumiy Natija'] = user.results[topic.topicId].score;
            }

            // Detailed Columns
            tests.forEach(test => {
                const res = user.results[test.testId];
                row[test.title] = res ? res.score : '-';
            });

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Natijalar");
        XLSX.writeFile(wb, `${topic.title}_natijalar.xlsx`);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
        if (timestamp instanceof Date) return timestamp.toLocaleDateString();
        return new Date(timestamp).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 text-center text-white">
                Mavzu topilmadi.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                <Link
                    href="/admin/quick-tests"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Ortga qaytish</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium border border-cyan-500/30">
                                Umumiy Natijalar
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{topic.title}</h1>
                        <p className="text-slate-400">{tests.length} ta test bo'yicha o'quvchilar reytingi</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-all"
                        >
                            <Download size={20} />
                            Excel yuklash
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center gap-4">
                        <Search className="text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Ism bo'yicha qidirish..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none text-white placeholder-slate-500 focus:outline-none w-full"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-sm border-b border-slate-800">
                                    <th className="p-4 w-16 text-center">#</th>
                                    <th className="p-4">F.I.SH</th>
                                    <th className="p-4 text-center">Testlar</th>
                                    <th className="p-4 text-center">Jami Ball</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredResults.map((user, index) => (
                                    <React.Fragment key={user.userId}>
                                        <tr
                                            className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${expandedUser === user.userId ? 'bg-slate-800/30' : ''}`}
                                            onClick={() => setExpandedUser(expandedUser === user.userId ? null : user.userId)}
                                        >
                                            <td className="p-4 text-center text-slate-500 font-mono">
                                                {index < 3 ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                            index === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                                'bg-amber-700/20 text-amber-600'
                                                        }`}>
                                                        {index === 0 ? <Trophy size={16} /> : index + 1}
                                                    </div>
                                                ) : (
                                                    index + 1
                                                )}
                                            </td>
                                            <td className="p-4 font-medium text-white">
                                                {user.userName}
                                            </td>
                                            <td className="p-4 text-center text-slate-300">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs
                                                    ${user.completedTests === tests.length ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-400'}
                                                `}>
                                                    {user.completedTests}/{tests.length}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-xl font-bold text-cyan-400">{user.totalScore}</span>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {expandedUser === user.userId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </td>
                                        </tr>
                                        {expandedUser === user.userId && (
                                            <tr className="bg-slate-950/30">
                                                <td colSpan={5} className="p-4 pl-16">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {/* Unified Result Card */}
                                                        {user.results[topic.topicId] && (
                                                            <div className="p-3 rounded-xl border bg-slate-900 border-slate-700 relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-1">
                                                                    <div className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded">Umumiy</div>
                                                                </div>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-sm font-medium text-white">
                                                                        {topic.title}
                                                                    </span>
                                                                    <span className="text-green-400 font-bold ml-2">
                                                                        {user.results[topic.topicId].score} ball
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                    <Calendar size={12} />
                                                                    <span>
                                                                        {formatDate(user.results[topic.topicId].date)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Detailed Cards */}
                                                        {tests.map(test => {
                                                            const result = user.results[test.testId];
                                                            // Hide if Unified result exists as it supersedes? 
                                                            // Or show empty? 
                                                            // Let's show empty for consisteny, or hide if unified exists?
                                                            // User wants "Umumiy Test". showing individual creates noise.
                                                            // But if user has legacy results, show them.
                                                            if (user.results[topic.topicId] && !result) return null;

                                                            return (
                                                                <div
                                                                    key={test.testId}
                                                                    className={`p-3 rounded-xl border ${result
                                                                            ? 'bg-slate-900 border-slate-700'
                                                                            : 'bg-slate-900/50 border-slate-800 border-dashed opacity-60'
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="text-sm font-medium text-slate-300 line-clamp-1" title={test.title}>
                                                                            {test.title}
                                                                        </span>
                                                                        {result ? (
                                                                            <span className="text-green-400 font-bold">
                                                                                {result.score} ball
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-600 text-xs">----</span>
                                                                        )}
                                                                    </div>
                                                                    {result && (
                                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                            <Calendar size={12} />
                                                                            <span>
                                                                                {formatDate(result.date)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredResults.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            Natijalar topilmadi
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
