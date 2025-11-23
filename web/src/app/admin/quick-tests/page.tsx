'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickTest } from '@/lib/schema';
import { Plus, Trash2, Edit, Eye, BarChart3, Clock, Layers, Share2, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuickTestsPage() {
    const [tests, setTests] = useState<QuickTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadTests();
    }, []);

    const loadTests = async () => {
        try {
            const q = query(collection(db, 'quickTests'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const testsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                testId: doc.id
            })) as QuickTest[];
            setTests(testsData);
        } catch (error) {
            console.error('Error loading tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (testId: string) => {
        if (!confirm('Bu tezkor imtihonni o\'chirishni xohlaysizmi?')) return;

        try {
            await deleteDoc(doc(db, 'quickTests', testId));
            setTests(tests.filter(t => t.testId !== testId));
        } catch (error) {
            console.error('Error deleting test:', error);
            alert('Xatolik yuz berdi');
        }
    };

    const copyShareLink = (testId: string) => {
        const link = `${window.location.origin}/quick-tests/public/${testId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(testId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleActive = async (test: QuickTest) => {
        // Will implement in the edit page
        router.push(`/admin/quick-tests/${test.testId}/edit`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Yuklanmoqda...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tezkor Imtihonlar</h1>
                    <p className="text-slate-400">Foydalanuvchilar uchun tezkor imtihonlarni boshqaring</p>
                </div>
                <Link
                    href="/admin/quick-tests/create"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                    <Plus size={20} />
                    Yangi Imtihon
                </Link>
            </div>

            {tests.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Layers className="text-slate-600" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Hech qanday imtihon yo'q</h3>
                    <p className="text-slate-400 mb-6">Birinchi tezkor imtihonni yarating</p>
                    <Link
                        href="/admin/quick-tests/create"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                    >
                        <Plus size={20} />
                        Imtihon Yaratish
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tests.map((test) => (
                        <div
                            key={test.testId}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-white">{test.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${test.isActive
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/20'
                                            }`}>
                                            {test.isActive ? 'Faol' : 'Nofaol'}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 mb-4">{test.description}</p>

                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Layers size={16} className="text-cyan-400" />
                                            <span>{test.totalLevels} bosqich</span>
                                        </div>
                                        {test.timeLimit && (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={16} className="text-blue-400" />
                                                <span>{Math.floor(test.timeLimit / 60)} daqiqa</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="text-xs">
                                                {new Date(test.createdAt.toDate()).toLocaleDateString('uz-UZ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyShareLink(test.testId)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${copiedId === test.testId
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
                                            }`}
                                        title="Linkni nusxalash"
                                    >
                                        {copiedId === test.testId ? (
                                            <>
                                                <Check size={18} />
                                                <span className="text-sm font-medium">Nusxalandi!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Share2 size={18} />
                                                <span className="text-sm font-medium">Link</span>
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href={`/admin/quick-tests/${test.testId}/results`}
                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                        title="Natijalar"
                                    >
                                        <BarChart3 size={20} />
                                    </Link>
                                    <Link
                                        href={`/admin/quick-tests/${test.testId}/preview`}
                                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                        title="Ko'rish"
                                    >
                                        <Eye size={20} />
                                    </Link>
                                    <Link
                                        href={`/admin/quick-tests/${test.testId}/edit`}
                                        className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                        title="Tahrirlash"
                                    >
                                        <Edit size={20} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(test.testId)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
