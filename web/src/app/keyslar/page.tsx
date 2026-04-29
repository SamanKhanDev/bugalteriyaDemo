'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { CaseStudy, CaseStudyResult } from '@/lib/schema';
import { FileText, Clock, ArrowRight, ArrowLeft, Trophy, Calendar, CheckCircle, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

function CaseCard({ caseItem, result, onClick }: { caseItem: CaseStudy; result?: CaseStudyResult; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="text-amber-400" size={24} />
                </div>
                {result && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${result.status === 'graded' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {result.status === 'graded' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {result.status === 'graded' ? `${result.score} ball` : 'Topshirilgan'}
                    </div>
                )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">
                {caseItem.title}
            </h3>

            <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                {caseItem.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-amber-400" />
                    <span>{caseItem.totalQuestions} savol</span>
                </div>
                {caseItem.timeLimit && (
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-400" />
                        <span>{Math.floor(caseItem.timeLimit / 60)} daq</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UserKeyslarPage() {
    const { user } = useStore();
    const router = useRouter();
    const [cases, setCases] = useState<CaseStudy[]>([]);
    const [results, setResults] = useState<CaseStudyResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const qCases = query(collection(db, 'caseStudies'), where('isActive', '==', true), orderBy('createdAt', 'desc'));
                const casesSnapshot = await getDocs(qCases);
                const casesData = casesSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    caseId: doc.id
                })) as CaseStudy[];

                if (user) {
                    const qResults = query(
                        collection(db, 'caseStudyResults'), 
                        where('userId', '==', user.userId),
                        orderBy('completedAt', 'desc')
                    );
                    const resultsSnapshot = await getDocs(qResults);
                    const resultsData = resultsSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        resultId: doc.id
                    })) as CaseStudyResult[];
                    setResults(resultsData);
                }

                setCases(casesData.filter(c => !c.isArchived));
            } catch (error) {
                console.error('Error loading cases:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
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

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-4">
                        <FileText size={16} />
                        Keyslar & Vaziyatli Savollar
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Vaziyatlarni Tahlil Qiling
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Real vaziyatlar asosida berilgan ochiq savollarga javob bering va o'z tahliliy mahoratingizni namoyish eting
                    </p>
                </div>

                {cases.length === 0 ? (
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="text-slate-600" size={40} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Hozircha keyslar yo'q</h3>
                        <p className="text-slate-400">Tez orada yangi vaziyatli savollar qo'shiladi</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cases.map((caseItem) => (
                            <CaseCard
                                key={caseItem.caseId}
                                caseItem={caseItem}
                                result={results.find(r => r.caseId === caseItem.caseId)}
                                onClick={() => router.push(`/keyslar/${caseItem.caseId}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
