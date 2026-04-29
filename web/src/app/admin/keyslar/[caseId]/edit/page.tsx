'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc, updateDoc, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, Edit3, FileJson, ChevronDown, ChevronUp, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { CaseStudy, CaseStudyQuestion } from '@/lib/schema';
import { use } from 'react';

export default function EditCasePage({ params }: { params: Promise<{ caseId: string }> }) {
    const { caseId } = use(params);
    const { user } = useStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Basic info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [isActive, setIsActive] = useState(true);
    const [activeStartDate, setActiveStartDate] = useState<string>('');
    const [activeEndDate, setActiveEndDate] = useState<string>('');
    const [activeDate, setActiveDate] = useState<string>('');
    const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
    const [activeTimeFrom, setActiveTimeFrom] = useState<string>('');
    const [activeTimeTo, setActiveTimeTo] = useState<string>('');

    // Questions
    const [questions, setQuestions] = useState<CaseStudyQuestion[]>([]);
    const [originalQuestionIds, setOriginalQuestionIds] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, [caseId]);

    const loadData = async () => {
        try {
            const caseDoc = await getDoc(doc(db, 'caseStudies', caseId));
            if (caseDoc.exists()) {
                const data = caseDoc.data() as CaseStudy;
                setTitle(data.title);
                setDescription(data.description);
                setTimeLimit(data.timeLimit);
                setIsActive(data.isActive);
                setActiveStartDate(data.activeStartDate || '');
                setActiveEndDate(data.activeEndDate || '');
                setActiveDate(data.activeDate || '');
                setActiveTimeFrom(data.activeTimeFrom || '');
                setActiveTimeTo(data.activeTimeTo || '');
                setDateMode(data.activeDate ? 'single' : 'range');
            }

            const questionsSnap = await getDocs(query(collection(db, 'caseStudies', caseId, 'questions')));
            const questionsData = questionsSnap.docs.map(doc => ({
                ...doc.data(),
                questionId: doc.id
            })) as CaseStudyQuestion[];
            setQuestions(questionsData);
            setOriginalQuestionIds(questionsData.map(q => q.questionId));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            questionId: `temp-${crypto.randomUUID()}`,
            questionText: '',
            sampleAnswer: '',
            explanation: ''
        }]);
    };

    const removeQuestion = (questionId: string) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter(q => q.questionId !== questionId));
    };

    const updateQuestion = (questionId: string, field: keyof CaseStudyQuestion, value: string) => {
        setQuestions(questions.map(q => q.questionId === questionId ? { ...q, [field]: value } : q));
    };

    const handleSave = async () => {
        if (!title.trim()) return alert('Nomini kiriting');
        setSaving(true);
        try {
            const caseData: any = {
                title,
                description,
                updatedAt: Timestamp.now(),
                isActive,
                totalQuestions: questions.length
            };

            if (timeLimit !== undefined) caseData.timeLimit = timeLimit;
            
            if (dateMode === 'single') {
                caseData.activeDate = activeDate;
                caseData.activeStartDate = null;
                caseData.activeEndDate = null;
            } else {
                caseData.activeDate = null;
                caseData.activeStartDate = activeStartDate;
                caseData.activeEndDate = activeEndDate;
            }
            caseData.activeTimeFrom = activeTimeFrom;
            caseData.activeTimeTo = activeTimeTo;

            await updateDoc(doc(db, 'caseStudies', caseId), caseData);

            // Update questions
            // 1. Delete questions that are no longer in the list
            const currentIds = questions.map(q => q.questionId);
            const toDelete = originalQuestionIds.filter(id => !currentIds.includes(id));
            for (const id of toDelete) {
                await deleteDoc(doc(db, 'caseStudies', caseId, 'questions', id));
            }

            // 2. Add or update questions
            for (const q of questions) {
                const qData = { ...q };
                const isTemp = q.questionId.startsWith('temp-');
                const qId = isTemp ? null : q.questionId;
                
                // Remove questionId from data to save
                const { questionId, ...dataToSave } = qData;

                if (isTemp) {
                    await addDoc(collection(db, 'caseStudies', caseId, 'questions'), dataToSave);
                } else {
                    await updateDoc(doc(db, 'caseStudies', caseId, 'questions', questionId), dataToSave);
                }
            }

            alert('O\'zgarishlar saqlandi!');
            router.push('/admin/keyslar');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Keysni Tahrirlash</h1>
                        <p className="text-slate-400">{title}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Asosiy Sozlamalar</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Nomi</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Tavsif</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" rows={4} />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-amber-500" />
                            <span className="text-slate-300">Faol</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-white">Savollar</h2>
                    {questions.map((q, idx) => (
                        <div key={q.questionId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-amber-500 font-bold">SAVOL {idx + 1}</span>
                                <button onClick={() => removeQuestion(q.questionId)} className="text-slate-500 hover:text-red-400"><Trash2 size={18} /></button>
                            </div>
                            <textarea
                                value={q.questionText}
                                onChange={(e) => updateQuestion(q.questionId, 'questionText', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                                placeholder="Savol matni..."
                                rows={2}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <textarea
                                    value={q.sampleAnswer}
                                    onChange={(e) => updateQuestion(q.questionId, 'sampleAnswer', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm"
                                    placeholder="Namuna javob..."
                                    rows={2}
                                />
                                <textarea
                                    value={q.explanation}
                                    onChange={(e) => updateQuestion(q.questionId, 'explanation', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm"
                                    placeholder="Tushuntirish..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}
                    <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-amber-500 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-all">
                        <Plus size={20} /> Savol qo'shish
                    </button>
                </div>
            </div>
        </div>
    );
}
