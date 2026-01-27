'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, deleteDoc, doc, orderBy, updateDoc, addDoc, serverTimestamp, writeBatch, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickTest, QuickTestResult, QuickTestTopic } from '@/lib/schema';
import { Plus, Trash2, Edit, Eye, BarChart3, Clock, Layers, Share2, Copy, Check, Search, Calendar, Folder, Tag, ChevronDown, ChevronUp, UserMinus, X, Merge, Archive, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Test Card Component
function TestCard({ test, selectedTests, toggleTestSelection, onDelete, copyShareLink, copiedId, hideCheckbox = false, compact = false, onRestore }: {
    test: QuickTest;
    selectedTests: string[];
    toggleTestSelection: (testId: string) => void;
    onDelete: (testId: string) => void;
    copyShareLink: (testId: string) => void;
    copiedId: string | null;
    hideCheckbox?: boolean;
    compact?: boolean;
    onRestore?: (testId: string) => void;
}) {
    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-xl ${compact ? 'p-4' : 'p-6'} hover:border-cyan-500/30 transition-all ${test.isArchived ? 'opacity-70 border-slate-700/50' : ''}`}>
            <div className="flex items-start gap-4">
                {!hideCheckbox && !test.isArchived && (
                    <div className="flex items-center pt-1">
                        <input
                            type="checkbox"
                            checked={selectedTests.includes(test.testId)}
                            onChange={() => toggleTestSelection(test.testId)}
                            className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-800 checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer transition-all"
                        />
                    </div>
                )}

                <div className="flex items-start justify-between flex-1">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-white`}>{test.title}</h3>
                            {test.isArchived ? (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                                    Arxivlangan
                                </span>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${test.isActive
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/20'
                                    }`}>
                                    {test.isActive ? 'Faol' : 'Nofaol'}
                                </span>
                            )}
                        </div>
                        {!compact && <p className="text-slate-400 mb-4">{test.description}</p>}

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
                            {!compact && (test.activeStartDate || test.activeEndDate) && (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Calendar size={16} className="text-orange-400" />
                                    <span>
                                        {test.activeStartDate || '...'} dan {test.activeEndDate || '...'} gacha
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {test.isArchived && onRestore && (
                            <button
                                onClick={() => onRestore(test.testId)}
                                className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                title="Qayta tiklash"
                            >
                                <ArchiveRestore size={20} />
                            </button>
                        )}

                        {!compact && !test.isArchived && (
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
                        )}
                        <Link
                            href={`/admin/quick-tests/${test.testId}/results`}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Natijalar"
                        >
                            <BarChart3 size={20} />
                        </Link>
                        {!test.isArchived && (
                            <>
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
                            </>
                        )}
                        <button
                            onClick={() => onDelete(test.testId)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="O'chirish"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function QuickTestsPage() {
    const [tests, setTests] = useState<QuickTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTests, setSelectedTests] = useState<string[]>([]);

    // Archive State
    const [showArchived, setShowArchived] = useState(false);

    // Merge State
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [mergeTestTitle, setMergeTestTitle] = useState('');
    const [mergeTestDescription, setMergeTestDescription] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [mergeProgress, setMergeProgress] = useState('');

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
        if (!confirm('Bu tezkor imtihonni butunlay o\'chirishni xohlaysizmi? Qayta tiklab bo\'lmaydi.')) return;

        try {
            await deleteDoc(doc(db, 'quickTests', testId));
            setTests(tests.filter(t => t.testId !== testId));
        } catch (error) {
            console.error('Error deleting test:', error);
            alert('Xatolik yuz berdi');
        }
    };

    const handleRestore = async (testId: string) => {
        if (!confirm('Bu imtihonni arxivdan chiqarishni xohlaysizmi?')) return;
        try {
            await updateDoc(doc(db, 'quickTests', testId), { isArchived: false });
            // Refresh local state without reload
            setTests(prev => prev.map(t => t.testId === testId ? { ...t, isArchived: false } : t));
        } catch (error) {
            console.error('Error restoring test:', error);
            alert('Xatolik yuz berdi');
        }
    };

    const copyShareLink = (testId: string) => {
        const link = `${window.location.origin}/quick-tests/public/${testId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(testId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleTestSelection = (testId: string) => {
        setSelectedTests(prev => {
            if (prev.includes(testId)) {
                return prev.filter(id => id !== testId);
            } else {
                return [...prev, testId];
            }
        });
    };

    const handleMergeTests = async () => {
        if (!mergeTestTitle.trim()) {
            alert('Test nomini kiriting!');
            return;
        }
        setIsMerging(true);
        setMergeProgress('Yangi test yaratilmoqda...');

        try {
            // 1. Create New QuickTest
            const newTestRef = await addDoc(collection(db, 'quickTests'), {
                title: mergeTestTitle,
                description: mergeTestDescription || 'Birlashtirilgan test',
                totalLevels: 0,
                isActive: true, // Default active
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'admin',
                topicId: null
            });

            let globalLevelCounter = 1;
            const batchSizeLimit = 450;
            let batchedUpdates = [];

            // 2. Loop selected tests to fetch and copy questions + results
            const selectedTestsOrdered = tests
                .filter(t => selectedTests.includes(t.testId))
                .sort((a, b) => (selectedTests.indexOf(a.testId) - selectedTests.indexOf(b.testId)));

            for (const test of selectedTestsOrdered) {
                setMergeProgress(`${test.title} ko'chirilmoqda...`);

                // Fetch Levels
                const levelsSnap = await getDocs(query(collection(db, 'quickTests', test.testId, 'levels'), orderBy('levelNumber')));

                // 3. Clone Levels and Results
                for (const levelDoc of levelsSnap.docs) {
                    const levelData = levelDoc.data();
                    const newLevelNumber = globalLevelCounter++;

                    // Create New Level
                    const newLevelRef = await addDoc(collection(db, 'quickTests', newTestRef.id, 'levels'), {
                        ...levelData,
                        levelNumber: newLevelNumber,
                        title: `${test.title} - ${levelData.title || 'Bosqich'}`
                    });

                    // MIGRATE RESULTS for this Level
                    // Fetch old results
                    const resultsQuery = query(
                        collection(db, 'quickTestResults'),
                        where('testId', '==', test.testId),
                        where('levelId', '==', levelDoc.id)
                    );
                    const resultsSnap = await getDocs(resultsQuery);

                    for (const resultDoc of resultsSnap.docs) {
                        const rData = resultDoc.data() as QuickTestResult;

                        // Prepare new Result
                        const newResult = {
                            ...rData,
                            testId: newTestRef.id,
                            levelId: newLevelRef.id,
                            levelNumber: newLevelNumber,
                            transferredFrom: `${test.testId}_${levelDoc.id}` // Optional audit trail
                        };
                        // Remove old ID and create new doc ref
                        const newResultRef = doc(collection(db, 'quickTestResults'));

                        // Add to batch
                        if (batchedUpdates.length >= batchSizeLimit) {
                            const batch = writeBatch(db);
                            batchedUpdates.forEach(({ ref, data }) => batch.set(ref, data));
                            await batch.commit();
                            batchedUpdates = [];
                        }
                        batchedUpdates.push({ ref: newResultRef, data: newResult });
                    }
                }

                // Archive origin test
                await updateDoc(doc(db, 'quickTests', test.testId), { isArchived: true });
            }

            // Commit remaining batches
            if (batchedUpdates.length > 0) {
                const batch = writeBatch(db);
                batchedUpdates.forEach(({ ref, data }) => batch.set(ref, data));
                await batch.commit();
            }

            // 4. Update New Test meta
            await updateDoc(newTestRef, { totalLevels: globalLevelCounter - 1 });

            // 5. Reset
            setShowMergeModal(false);
            setMergeTestTitle('');
            setSelectedTests([]);
            await loadTests();
            alert('Testlar muvaffaqiyatli birlashtirildi va natijalar ko\'chirildi!');

        } catch (error) {
            console.error('Merge error:', error);
            alert('Birlashtirishda xatolik yuz berdi');
        } finally {
            setIsMerging(false);
            setMergeProgress('');
        }
    };

    // Filter logic
    const allFilteredTests = tests.filter(test => {
        const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.description.toLowerCase().includes(searchTerm.toLowerCase());

        const archiveStatus = showArchived ? true : !test.isArchived;

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
                    <h1 className="text-3xl font-bold text-white mb-2">Tezkor Imtihonlar</h1>
                    <p className="text-slate-400">Foydalanuvchilar uchun tezkor imtihonlarni boshqaring</p>
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
                        href="/admin/quick-tests/create"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                    >
                        <Plus size={20} />
                        Yangi Imtihon
                    </Link>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Imtihonlarni qidirish..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
            </div>

            {/* Selection Controls - MERGE ONLY MODE */}
            {tests.filter(t => !t.isArchived).length > 0 && (
                <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-4 sticky top-4 z-20 backdrop-blur-md shadow-lg">
                    <div className="flex items-center gap-3">
                        <Merge className="text-purple-400" size={20} />
                        <span className="text-white font-medium">
                            {selectedTests.length > 0
                                ? `${selectedTests.length} ta test tanlandi`
                                : 'Testlarni birlashtirish uchun tanlang'}
                        </span>
                        {selectedTests.length > 0 && (
                            <button
                                onClick={() => setSelectedTests([])}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                (Tozalash)
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowMergeModal(true)}
                        disabled={selectedTests.length < 2}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${selectedTests.length >= 2
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <Merge size={18} />
                        Yangi Testga Birlashtirish
                    </button>
                </div>
            )}

            {allFilteredTests.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    {searchTerm ? 'Qidiruv bo\'yicha hech narsa topilmadi' : 'Hech qanday imtihon ko\'rsatilmayapti'}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* List Only - No Topics Display */}
                    {allFilteredTests.map((test: QuickTest) => (
                        <TestCard
                            key={test.testId}
                            test={test}
                            selectedTests={selectedTests}
                            toggleTestSelection={toggleTestSelection}
                            onDelete={handleDelete}
                            onRestore={handleRestore}
                            copyShareLink={copyShareLink}
                            copiedId={copiedId}
                        />
                    ))}
                </div>
            )}

            {/* Merge Modal */}
            {showMergeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Merge className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Testlarni Birlashtirish
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        {selectedTests.length} ta testdan yangi test yaratish
                                    </p>
                                </div>
                            </div>
                            {!isMerging && (
                                <button
                                    onClick={() => setShowMergeModal(false)}
                                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Yangi Test Nomi <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={mergeTestTitle}
                                    onChange={(e) => setMergeTestTitle(e.target.value)}
                                    placeholder="Masalan: Yakuniy Imtihon"
                                    disabled={isMerging}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tavsif (ixtiyoriy)
                                </label>
                                <textarea
                                    value={mergeTestDescription}
                                    onChange={(e) => setMergeTestDescription(e.target.value)}
                                    placeholder="Test haqida ma'lumot..."
                                    rows={3}
                                    disabled={isMerging}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none disabled:opacity-50"
                                />
                            </div>

                            {isMerging && (
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent mx-auto mb-2"></div>
                                    <p className="text-purple-400 text-sm">{mergeProgress}</p>
                                </div>
                            )}

                            {!isMerging && (
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                    <p className="text-sm font-medium text-slate-300 mb-2">Tanlangan testlar (Avtomatik arxivlanadi):</p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                        {selectedTests.map(testId => {
                                            const test = tests.find(t => t.testId === testId);
                                            return test ? (
                                                <div key={testId} className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                                    <span className="text-slate-400">{test.title} ({test.totalLevels} bosqich)</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                    <p className="text-xs text-yellow-500 mt-2">
                                        Eslatma: Barcha foydalanuvchi natijalari ham yangi testga ko'chiriladi.
                                    </p>
                                </div>
                            )}
                        </div>

                        {!isMerging && (
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowMergeModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleMergeTests}
                                    disabled={!mergeTestTitle.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer font-medium flex justify-center items-center gap-2"
                                >
                                    <Merge size={18} />
                                    Birlashtirish
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
