'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { QuickTest, QuickTestTopic, QuickTestResult } from '@/lib/schema';
import { Layers, Clock, Zap, ArrowRight, ArrowLeft, Trophy, Calendar, Lock, Folder, ChevronDown, ChevronUp, Star, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

// Sub-component for individual test display (used in Topic list and standalone)
function UserTestCard({ test, result, onClick }: { test: QuickTest; result?: QuickTestResult; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-4 md:p-6 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Zap className="text-cyan-400" size={24} />
                </div>
                {result && (
                    <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/20">
                        <CheckCircle size={12} />
                        {result.score} ball
                    </div>
                )}
            </div>

            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                {test.title}
            </h3>

            <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">
                {test.description || 'Bilimingizni sinab ko\'ring'}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-cyan-400" />
                    <span>{test.totalLevels} bosqich</span>
                </div>
                {test.timeLimit && (
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-400" />
                        <span>{Math.floor(test.timeLimit / 60)} daq</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Topic Card Component - Accordion Style
function UserTopicCard({ topic, tests, results, onStartTest }: {
    topic: QuickTestTopic;
    tests: QuickTest[];
    results: QuickTestResult[];
    onStartTest: (testId: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [lockStatus, setLockStatus] = useState<{ isLocked: boolean; lockReason: string }>({
        isLocked: !topic.isActive,
        lockReason: ''
    });

    useEffect(() => {
        const calculateLockStatus = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            let isLocked = !topic.isActive;
            let lockReason = '';

            if (!isLocked) {
                if (topic.activeDate && topic.activeDate !== today) {
                    if (topic.activeDate > today) {
                        isLocked = true;
                        lockReason = `Ochilish sanasi: ${topic.activeDate}`;
                    } else if (topic.activeDate < today) {
                        isLocked = true;
                        lockReason = `Muddat o'tgan: ${topic.activeDate}`;
                    }
                } else if (topic.activeStartDate && topic.activeStartDate > today) {
                    isLocked = true;
                    lockReason = `Boshlanish: ${topic.activeStartDate}`;
                } else if (topic.activeEndDate && topic.activeEndDate < today) {
                    isLocked = true;
                    lockReason = `Muddat tugagan: ${topic.activeEndDate}`;
                }

                if (!isLocked && topic.activeTimeFrom && topic.activeDate === today && currentTime < topic.activeTimeFrom) {
                    isLocked = true;
                    lockReason = `Soat ${topic.activeTimeFrom} da ochiladi`;
                } else if (!isLocked && topic.activeTimeTo && topic.activeDate === today && currentTime > topic.activeTimeTo) {
                    isLocked = true;
                    lockReason = `Vaqt tugadi: ${topic.activeTimeTo}`;
                }
            } else {
                lockReason = 'Hozircha yopiq';
            }
            return { isLocked, lockReason };
        };

        setLockStatus(calculateLockStatus());
    }, [topic]);

    const { isLocked, lockReason } = lockStatus;
    const completedCount = tests.filter(t => results.some(r => r.testId === t.testId)).length;
    const dateInfo = topic.activeDate || (topic.activeStartDate && topic.activeEndDate ? `${topic.activeStartDate} - ${topic.activeEndDate}` : null);


    return (
        <div className={`border-2 rounded-2xl transition-all duration-300 overflow-hidden ${expanded ? 'bg-slate-900/40 border-indigo-500/50' : 'bg-slate-900/20 border-slate-800 hover:border-indigo-500/30'
            } ${isLocked ? 'opacity-75' : ''}`}>

            <div
                onClick={() => !isLocked && setExpanded(!expanded)}
                className={`p-6 flex items-start justify-between cursor-pointer relative ${isLocked ? 'cursor-not-allowed' : ''}`}
            >
                {/* Background Gradient on Hover/Expand */}
                {!isLocked && (
                    <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />
                )}

                <div className="flex items-start gap-4 flex-1 relative z-10">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isLocked ? 'bg-slate-800' : expanded ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-slate-800 group-hover:bg-indigo-900/50'
                        }`}>
                        {isLocked ? <Lock className="text-slate-500" size={24} /> : <Folder className={expanded ? "text-white" : "text-indigo-400"} size={28} />}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-xl font-bold transition-colors ${isLocked ? 'text-slate-400' : 'text-white'}`}>
                                {topic.title}
                            </h3>
                            {!isLocked && completedCount === tests.length && tests.length > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/20">
                                    <CheckCircle size={12} />
                                    <span>Barchasi yechilgan</span>
                                </div>
                            )}
                        </div>

                        {topic.description && (
                            <p className="text-slate-400 text-sm mb-3 max-w-2xl">{topic.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className={`flex items-center gap-1.5 ${isLocked ? 'text-slate-500' : 'text-indigo-300'}`}>
                                <Layers size={16} />
                                <span>{tests.length} ta test</span>
                            </div>

                            {dateInfo && (
                                <div className={`flex items-center gap-1.5 ${isLocked ? 'text-slate-500' : 'text-blue-300'}`}>
                                    <Calendar size={16} />
                                    <span>{dateInfo}</span>
                                </div>
                            )}

                            {completedCount > 0 && !isLocked && (
                                <div className="flex items-center gap-1.5 text-green-400">
                                    <Trophy size={16} />
                                    <span>{completedCount}/{tests.length} yechilgan</span>
                                </div>
                            )}
                        </div>

                        {isLocked && (
                            <div className="mt-2 text-red-400 text-sm font-medium flex items-center gap-2">
                                <Lock size={14} />
                                {lockReason}
                            </div>
                        )}
                    </div>
                </div>

                {!isLocked && (
                    <div className={`relative z-10 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180 bg-indigo-500/20 text-indigo-400' : 'text-slate-400'}`}>
                        <ChevronDown size={20} />
                    </div>
                )}
            </div>

            {/* Expanded Content */}
            <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100 border-t border-slate-800/50' : 'grid-rows-[0fr] opacity-0'
                }`}>
                <div className="overflow-hidden">
                    <div className="p-6 pt-2 bg-slate-900/20">
                        {tests.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">Bu mavzuda testlar mavjud emas</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tests.map(test => {
                                    // Use result for THIS testId.
                                    // If result is Unified, testId might be topicId.
                                    // But we are reverting, so we expect testId=testId results.
                                    // If legacy unified results exist, they won't match here, which is fine (user starting fresh?).
                                    // Actually, old non-unified results are fine.
                                    const testResult = results.find(r => r.testId === test.testId);
                                    return (
                                        <UserTestCard
                                            key={test.testId}
                                            test={test}
                                            result={testResult}
                                            onClick={() => onStartTest(test.testId)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function UserQuickTestsPage() {
    const { user } = useStore();
    const router = useRouter();
    const [tests, setTests] = useState<QuickTest[]>([]);
    const [topics, setTopics] = useState<QuickTestTopic[]>([]);
    const [results, setResults] = useState<QuickTestResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Tests
                const qTests = query(collection(db, 'quickTests'), orderBy('createdAt', 'desc'));
                const testsSnapshot = await getDocs(qTests);
                const testsData = testsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    testId: doc.id
                })) as QuickTest[];

                // Fetch Topics
                const qTopics = query(collection(db, 'quickTestTopics'), orderBy('order', 'asc'), orderBy('createdAt', 'desc'));
                const topicsSnapshot = await getDocs(qTopics);
                const topicsData = topicsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    topicId: doc.id
                })) as QuickTestTopic[];

                // Fetch User Results
                if (user) {
                    const qResults = query(collection(db, 'quickTestResults'), where('userId', '==', user.userId));
                    const resultsSnapshot = await getDocs(qResults);
                    const resultsData = resultsSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        resultId: doc.id
                    })) as QuickTestResult[];
                    setResults(resultsData);
                }

                // Filter active tests
                const activeTests = testsData.filter(t => t.isActive !== false);
                setTests(activeTests);
                setTopics(topicsData);

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const ungroupedTests = tests.filter(test => !test.topicId);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {user && (
                <Navbar
                    userId={user.userId}
                    userName={user.name}
                    uniqueId={user.uniqueId}
                    onLogout={handleLogout}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-12 pt-24">
                <div className="text-center mb-12 relative">
                    <Link
                        href="/dashboard"
                        className="absolute left-0 top-0 hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Dashboard</span>
                    </Link>

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-4">
                        <Zap size={16} />
                        Tezkor Imtihonlar
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Bilimingizni Sinab Ko'ring
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Bosqichma-bosqich imtihonlar orqali o'z bilimingizni tekshiring va reytingda yuqori o'rinlarni egallang
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Topics Section - Accordion Layout */}
                    {topics.length > 0 && (
                        <div className="grid grid-cols-1 gap-6">
                            {topics.map(topic => (
                                <UserTopicCard
                                    key={topic.topicId}
                                    topic={topic}
                                    tests={tests.filter(t => t.topicId === topic.topicId)}
                                    results={results}
                                    onStartTest={(testId) => router.push(`/quick-tests/${testId}`)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Ungrouped Tests Section */}
                    {ungroupedTests.length > 0 && (
                        <div className="space-y-6">
                            {(topics.length > 0) && (
                                <div className="flex items-center gap-4 text-slate-400 pt-8 border-t border-slate-800">
                                    <Layers size={20} />
                                    <h2 className="text-xl font-semibold">Qo'shimcha Imtihonlar</h2>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ungroupedTests.map((test) => (
                                    <div key={test.testId} className="h-full">
                                        <UserTestCard
                                            test={test}
                                            result={results.find(r => r.testId === test.testId)}
                                            onClick={() => router.push(`/quick-tests/${test.testId}`)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {topics.length === 0 && ungroupedTests.length === 0 && !loading && (
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Zap className="text-slate-600" size={40} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Hozircha imtihonlar yo'q</h3>
                        <p className="text-slate-400">Tez orada yangi imtihonlar qo'shiladi</p>
                    </div>
                )}

                {/* Leaderboard CTA */}
                {(topics.length > 0 || ungroupedTests.length > 0) && (
                    <div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-8 text-center">
                        <Trophy className="text-cyan-400 mx-auto mb-4" size={48} />
                        <h3 className="text-2xl font-bold text-white mb-2">Reytingni Ko'ring</h3>
                        <p className="text-slate-400 mb-6">
                            Eng yaxshi natijalar va o'z o'rningizni aniqlang
                        </p>
                        <Link
                            href="/quick-tests/leaderboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                        >
                            <Trophy size={20} />
                            Reytingni Ko'rish
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
