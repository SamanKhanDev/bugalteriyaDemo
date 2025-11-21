'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TestStage } from '@/lib/schema';
import Link from 'next/link';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';

export default function AdminTestsPage() {
    const [stages, setStages] = useState<(TestStage & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStages = async () => {
            try {
                const stagesRef = collection(db, 'testStages');
                const q = query(stagesRef, orderBy('stageNumber'));
                const snapshot = await getDocs(q);

                const stagesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as TestStage & { id: string }));

                setStages(stagesData);
            } catch (error) {
                console.error('Error fetching stages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStages();
    }, []);

    const handleDeleteStage = async (stageId: string, stageTitle: string) => {
        if (!confirm(`"${stageTitle}" bosqichini o'chirmoqchimisiz?\n\nDiqqat: Bu bosqichdagi barcha savollar ham o'chiriladi!`)) {
            return;
        }

        try {
            // Delete the stage document
            await deleteDoc(doc(db, 'testStages', stageId));

            // Update local state
            setStages(prev => prev.filter(s => s.id !== stageId));

            alert('Bosqich muvaffaqiyatli o\'chirildi!');
        } catch (error) {
            console.error('Error deleting stage:', error);
            alert('Xatolik yuz berdi!');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Test Bosqichlari</h1>
                    <p className="text-slate-400">Barcha test bosqichlarini boshqaring</p>
                </div>
                <Link
                    href="/admin/tests/create"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20"
                >
                    <Plus size={20} />
                    Yangi Bosqich
                </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">#</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Nomi</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Tavsif</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Savollar</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Video</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Holat</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {stages.map((stage) => (
                                <tr key={stage.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{stage.stageNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{stage.title}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                                        {stage.description}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{stage.totalQuestions || 0}</td>
                                    <td className="px-6 py-4">
                                        {stage.videoUrl ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                Mavjud
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                                                Yo'q
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {stage.isLocked ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                Qulflangan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                Ochiq
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/stage/${stage.id}`}
                                                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                title="Ko'rish"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                            <Link
                                                href={`/admin/tests/${stage.id}/edit`}
                                                className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                title="Tahrirlash"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteStage(stage.id, stage.title)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                title="O'chirish"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {stages.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <p>Hozircha test bosqichlari mavjud emas</p>
                    </div>
                )}
            </div>
        </div>
    );
}
