'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TestStage, Question } from '@/lib/schema';
import { ArrowLeft, Save, Plus, Trash2, Loader2, FileJson, X } from 'lucide-react';
import Link from 'next/link';

export default function EditStagePage() {
    const params = useParams();
    const router = useRouter();
    const stageId = params.stageId as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stage, setStage] = useState<TestStage | null>(null);
    const [questions, setQuestions] = useState<(Question & { id: string })[]>([]);

    const [formData, setFormData] = useState({
        stageNumber: '',
        title: '',
        description: '',
        videoUrl: '',
        videoRequiredPercent: '',
        totalQuestions: '',
        isLocked: false
    });

    const [showJsonImport, setShowJsonImport] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stage
                const stageDoc = await getDoc(doc(db, 'testStages', stageId));
                if (stageDoc.exists()) {
                    const stageData = stageDoc.data() as TestStage;
                    setStage(stageData);
                    setFormData({
                        stageNumber: stageData.stageNumber.toString(),
                        title: stageData.title,
                        description: stageData.description,
                        videoUrl: stageData.videoUrl || '',
                        videoRequiredPercent: stageData.videoRequiredPercent?.toString() || '',
                        totalQuestions: stageData.totalQuestions?.toString() || '0',
                        isLocked: stageData.isLocked
                    });
                }

                // Fetch questions
                const questionsSnap = await getDocs(collection(db, 'testStages', stageId, 'questions'));
                const questionsData = questionsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Question & { id: string }));
                setQuestions(questionsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stageId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const updateData = {
                stageNumber: parseInt(formData.stageNumber),
                title: formData.title,
                description: formData.description,
                videoUrl: formData.videoUrl || null,
                videoRequiredPercent: formData.videoRequiredPercent ? parseInt(formData.videoRequiredPercent) : null,
                totalQuestions: parseInt(formData.totalQuestions) || 0,
                isLocked: formData.isLocked
            };

            await updateDoc(doc(db, 'testStages', stageId), updateData);

            alert('Bosqich muvaffaqiyatli yangilandi!');
            router.push('/admin/tests');
        } catch (error) {
            console.error('Error updating stage:', error);
            alert('Xatolik yuz berdi!');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Ushbu savolni o\'chirmoqchimisiz?')) return;

        try {
            await deleteDoc(doc(db, 'testStages', stageId, 'questions', questionId));
            setQuestions(prev => prev.filter(q => q.id !== questionId));
            alert('Savol o\'chirildi!');
        } catch (error) {
            console.error('Error deleting question:', error);
            alert('Xatolik yuz berdi!');
        }
    };

    const handleJsonImport = async () => {
        if (!jsonInput.trim()) return;

        setImporting(true);
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) {
                throw new Error('JSON massiv bo\'lishi kerak');
            }

            let count = 0;
            for (const q of parsed) {
                if (!q.questionText || !q.options || !Array.isArray(q.options)) {
                    continue; // Skip invalid
                }

                const questionData = {
                    questionText: q.questionText,
                    explanation: q.explanation || null,
                    order: q.order || (questions.length + count + 1)
                };

                const questionRef = await addDoc(
                    collection(db, 'testStages', stageId, 'questions'),
                    questionData
                );

                for (const opt of q.options) {
                    await addDoc(
                        collection(db, 'testStages', stageId, 'questions', questionRef.id, 'options'),
                        {
                            text: opt.text,
                            isCorrect: opt.isCorrect
                        }
                    );
                }
                count++;
            }

            await updateDoc(doc(db, 'testStages', stageId), {
                totalQuestions: increment(count)
            });

            alert(`${count} ta savol qo'shildi!`);
            setShowJsonImport(false);
            setJsonInput('');

            // Refresh questions
            const questionsSnap = await getDocs(collection(db, 'testStages', stageId, 'questions'));
            const questionsData = questionsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Question & { id: string }));
            setQuestions(questionsData);

        } catch (error) {
            console.error('Import error:', error);
            alert('Xatolik: ' + (error as Error).message);
        } finally {
            setImporting(false);
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
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/tests"
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Bosqichni Tahrirlash</h1>
                    <p className="text-slate-400">Bosqich ma'lumotlarini yangilang</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Bosqich raqami *
                        </label>
                        <input
                            type="number"
                            name="stageNumber"
                            value={formData.stageNumber}
                            onChange={handleChange}
                            required
                            min="1"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Savollar soni
                        </label>
                        <input
                            type="number"
                            name="totalQuestions"
                            value={formData.totalQuestions}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Sarlavha *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tavsif *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Video URL
                        </label>
                        <input
                            type="url"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Video ko'rish foizi (%)
                        </label>
                        <input
                            type="number"
                            name="videoRequiredPercent"
                            value={formData.videoRequiredPercent}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isLocked"
                                checked={formData.isLocked}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-2 focus:ring-purple-500/50"
                            />
                            <span className="text-slate-300">Bosqichni qulflash</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-800">
                    <Link
                        href="/admin/tests"
                        className="px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                    >
                        Bekor qilish
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Saqlanmoqda...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Saqlash
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* JSON Import Modal */}
            {showJsonImport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">JSON orqali savollar qo'shish</h3>
                            <button
                                onClick={() => setShowJsonImport(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="mb-4">
                                <p className="text-sm text-slate-400 mb-2">
                                    Quyidagi formatda JSON ma'lumotlarini kiriting:
                                </p>
                                <pre className="bg-slate-950 p-4 rounded-lg text-xs text-slate-300 overflow-x-auto font-mono border border-slate-800">
                                    {`[
  {
    "questionText": "Savol matni",
    "explanation": "Tushuntirish (ixtiyoriy)",
    "order": 1,
    "options": [
      { "text": "Variant 1", "isCorrect": true },
      { "text": "Variant 2", "isCorrect": false }
    ]
  }
]`}
                                </pre>
                            </div>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="w-full h-64 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
                                placeholder="JSON ma'lumotlarini shu yerga tashlang..."
                            />
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
                            <button
                                onClick={() => setShowJsonImport(false)}
                                className="px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleJsonImport}
                                disabled={importing || !jsonInput.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Yuklanmoqda...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Import qilish
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Questions Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Savollar ({questions.length})</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowJsonImport(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all border border-slate-700"
                        >
                            <FileJson size={18} />
                            JSON Import
                        </button>
                        <Link
                            href={`/admin/tests/${stageId}/questions/create`}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all"
                        >
                            <Plus size={18} />
                            Savol qo'shish
                        </Link>
                    </div>
                </div>

                <div className="space-y-3">
                    {questions.map((question, index) => (
                        <div key={question.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                            <div className="flex-1">
                                <span className="text-slate-400 text-sm">#{index + 1}</span>
                                <p className="text-white mt-1">{question.questionText}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/admin/tests/${stageId}/questions/${question.id}/edit`}
                                    className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Tahrirlash
                                </Link>
                                <button
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            Hozircha savollar mavjud emas
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
