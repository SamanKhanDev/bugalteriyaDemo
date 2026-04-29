'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, deleteDoc, doc, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CaseStudy } from '@/lib/schema';
import { Plus, Trash2, Edit, Eye, BarChart3, Clock, Layers, Share2, Copy, Check, Search, Calendar, Archive, ArchiveRestore, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Case Card Component
function CaseCard({ caseItem, onToggleArchive, onDelete, copyShareLink, copiedId }: {
    caseItem: CaseStudy;
    onToggleArchive: (caseId: string, isArchived: boolean) => void;
    onDelete: (caseId: string) => void;
    copyShareLink: (caseId: string) => void;
    copiedId: string | null;
}) {
    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-amber-500/30 transition-all ${caseItem.isArchived ? 'opacity-70 border-slate-700/50' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{caseItem.title}</h3>
                        {caseItem.isArchived ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                                Arxivlangan
                            </span>
                        ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${caseItem.isActive
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-slate-700/50 text-slate-400 border border-slate-600/20'
                                }`}>
                                {caseItem.isActive ? 'Faol' : 'Nofaol'}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 mb-4">{caseItem.description}</p>

                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <FileText size={16} className="text-amber-400" />
                            <span>{caseItem.totalQuestions} savol</span>
                        </div>
                        {caseItem.timeLimit && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock size={16} className="text-blue-400" />
                                <span>{Math.floor(caseItem.timeLimit / 60)} daqiqa</span>
                            </div>
                        )}
                        {(caseItem.activeStartDate || caseItem.activeEndDate) && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar size={16} className="text-orange-400" />
                                <span>
                                    {caseItem.activeStartDate || '...'} dan {caseItem.activeEndDate || '...'} gacha
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!caseItem.isArchived && (
                        <button
                            onClick={() => copyShareLink(caseItem.caseId)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${copiedId === caseItem.caseId
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
                                }`}
                            title="Linkni nusxalash"
                        >
                            {copiedId === caseItem.caseId ? (
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
                    )}
                    <Link
                        href={`/admin/keyslar/${caseItem.caseId}/results`}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Natijalar"
                    >
                        <BarChart3 size={20} />
                    </Link>
                    {!caseItem.isArchived && (
                        <>
                            <Link
                                href={`/admin/keyslar/${caseItem.caseId}/preview`}
                                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                title="Ko'rish"
                            >
                                <Eye size={20} />
                            </Link>
                            <Link
                                href={`/admin/keyslar/${caseItem.caseId}/edit`}
                                className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                title="Tahrirlash"
                            >
                                <Edit size={20} />
                            </Link>
                        </>
                    )}
                    <button
                        onClick={() => onToggleArchive(caseItem.caseId, !!caseItem.isArchived)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                        title={caseItem.isArchived ? "Arxivdan chiqarish" : "Arxivlash"}
                    >
                        {caseItem.isArchived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
                    </button>
                    <button
                        onClick={() => onDelete(caseItem.caseId)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="O'chirish"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function KeyslarPage() {
    const [cases, setCases] = useState<CaseStudy[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        loadCases();
    }, []);

    const loadCases = async () => {
        try {
            const q = query(collection(db, 'caseStudies'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const casesData = snapshot.docs.map(doc => ({
                ...doc.data(),
                caseId: doc.id
            })) as CaseStudy[];

            setCases(casesData);
        } catch (error) {
            console.error('Error loading cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (caseId: string) => {
        if (!confirm('Bu keysni butunlay o\'chirishni xohlaysizmi? Qayta tiklab bo\'lmaydi.')) return;

        try {
            await deleteDoc(doc(db, 'caseStudies', caseId));
            setCases(cases.filter(c => c.caseId !== caseId));
        } catch (error) {
            console.error('Error deleting case:', error);
            alert('Xatolik yuz berdi');
        }
    };

    const handleToggleArchive = async (caseId: string, isArchived: boolean) => {
        try {
            await updateDoc(doc(db, 'caseStudies', caseId), { isArchived: !isArchived });
            setCases(prev => prev.map(c => c.caseId === caseId ? { ...c, isArchived: !isArchived } : c));
        } catch (error) {
            console.error('Error toggling archive:', error);
            alert('Xatolik yuz berdi');
        }
    };

    const copyShareLink = (caseId: string) => {
        const link = `${window.location.origin}/keyslar/${caseId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(caseId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase());
        const archiveStatus = showArchived ? true : !c.isArchived;
        return matchesSearch && archiveStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Yuklanmoqda...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Keyslar (Ochiq Savollar)</h1>
                    <p className="text-slate-400">Vaziyatli masalalar va ochiq savollarni boshqaring</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-all ${showArchived
                                ? 'bg-slate-800 text-white border-slate-600'
                                : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                            }`}
                    >
                        {showArchived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
                        {showArchived ? 'Arxivni yashirish' : 'Arxivni ko\'rsatish'}
                    </button>
                    <Link
                        href="/admin/keyslar/create"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                    >
                        <Plus size={20} />
                        Yangi Keys
                    </Link>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Keyslarni qidirish..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
            </div>

            {filteredCases.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    {searchTerm ? 'Qidiruv bo\'yicha hech narsa topilmadi' : 'Hech qanday keys ko\'rsatilmayapti'}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCases.map((caseItem) => (
                        <CaseCard
                            key={caseItem.caseId}
                            caseItem={caseItem}
                            onToggleArchive={handleToggleArchive}
                            onDelete={handleDelete}
                            copyShareLink={copyShareLink}
                            copiedId={copiedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
