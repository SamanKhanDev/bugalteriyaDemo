'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Trash2, Save, FileJson, Edit3, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { CaseStudy, CaseStudyQuestion } from '@/lib/schema';

type InputMode = 'manual' | 'json';

export default function CreateCasePage() {
    const { user } = useStore();
    const router = useRouter();
    const [mode, setMode] = useState<InputMode>('manual');
    const [loading, setLoading] = useState(false);

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

    // Manual mode questions
    const [questions, setQuestions] = useState<CaseStudyQuestion[]>([
        {
            questionId: crypto.randomUUID(),
            questionText: '',
            sampleAnswer: '',
            explanation: ''
        }
    ]);

    // JSON mode
    const [jsonInput, setJsonInput] = useState('');

    const addQuestion = () => {
        setQuestions([...questions, {
            questionId: crypto.randomUUID(),
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

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (Array.isArray(parsed)) {
                const importedQuestions: CaseStudyQuestion[] = parsed.map((q: any) => ({
                    questionId: crypto.randomUUID(),
                    questionText: q.questionText || q.question || '',
                    imageUrl: q.imageUrl || '',
                    sampleAnswer: q.sampleAnswer || q.answer || '',
                    explanation: q.explanation || ''
                }));
                setQuestions(importedQuestions);
                setJsonInput('');
                alert('JSON muvaffaqiyatli import qilindi!');
            } else {
                alert('JSON array formatida bo\'lishi kerak');
            }
        } catch (error) {
            alert('JSON formatida xatolik: ' + (error as Error).message);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('Keys nomini kiriting');
            return;
        }

        if (questions.some(q => !q.questionText.trim())) {
            alert('Barcha savollarni to\'ldiring');
            return;
        }

        setLoading(true);
        try {
            const caseData: any = {
                title,
                description,
                createdBy: user?.userId || 'admin',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                isActive,
                totalQuestions: questions.length,
                isArchived: false
            };

            if (timeLimit !== undefined) caseData.timeLimit = timeLimit;
            if (activeStartDate) caseData.activeStartDate = activeStartDate;
            if (activeEndDate) caseData.activeEndDate = activeEndDate;
            if (activeTimeFrom) caseData.activeTimeFrom = activeTimeFrom;
            if (activeTimeTo) caseData.activeTimeTo = activeTimeTo;

            if (dateMode === 'single' && activeDate) {
                caseData.activeDate = activeDate;
            } else if (dateMode === 'range') {
                caseData.activeStartDate = activeStartDate;
                caseData.activeEndDate = activeEndDate;
            }

            const caseRef = await addDoc(collection(db, 'caseStudies'), caseData);

            // Add questions as a subcollection or within the document if small
            // Given the pattern, let's use a subcollection for consistency if needed, 
            // but for cases, keeping them in the doc might be simpler if there aren't hundreds.
            // However, quick-tests uses subcollection for levels. 
            // Let's use subcollection 'questions' for consistency.
            
            for (const q of questions) {
                await addDoc(collection(db, 'caseStudies', caseRef.id, 'questions'), q);
            }

            alert('Keys muvaffaqiyatli yaratildi!');
            router.push('/admin/keyslar');
        } catch (error) {
            console.error('Error creating case:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Yangi Keys Yaratish</h1>
                    <p className="text-slate-400">Vaziyatli masala va ochiq savollar to'plamini yarating</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                    <Save size={20} />
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Asosiy Ma'lumotlar</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Keys Nomi *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="Masalan: Inventarizatsiya jarayoni"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                                rows={4}
                                placeholder="Vaziyat haqida batafsil ma'lumot..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Vaqt Limiti (daqiqa)</label>
                            <input
                                type="number"
                                value={timeLimit ? timeLimit / 60 : ''}
                                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) * 60 : undefined)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="Ixtiyoriy"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-slate-300">Faol (Foydalanuvchilarga ko'rinadi)</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Vaqt va Sana</h2>
                        <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
                            <button
                                onClick={() => setDateMode('single')}
                                className={`flex-1 py-1.5 rounded-md text-sm transition-all ${dateMode === 'single' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Bir kun
                            </button>
                            <button
                                onClick={() => setDateMode('range')}
                                className={`flex-1 py-1.5 rounded-md text-sm transition-all ${dateMode === 'range' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Oraliq
                            </button>
                        </div>
                        {dateMode === 'single' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Sana</label>
                                <input
                                    type="date"
                                    value={activeDate}
                                    onChange={(e) => setActiveDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Dan</label>
                                    <input
                                        type="date"
                                        value={activeStartDate}
                                        onChange={(e) => setActiveStartDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Gacha</label>
                                    <input
                                        type="date"
                                        value={activeEndDate}
                                        onChange={(e) => setActiveEndDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Vaqt (dan)</label>
                                <input
                                    type="time"
                                    value={activeTimeFrom}
                                    onChange={(e) => setActiveTimeFrom(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Vaqt (gacha)</label>
                                <input
                                    type="time"
                                    value={activeTimeTo}
                                    onChange={(e) => setActiveTimeTo(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${mode === 'manual' ? 'bg-slate-800 text-white border border-amber-500/50' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
                        >
                            <Edit3 size={18} />
                            Qo'lda qo'shish
                        </button>
                        <button
                            onClick={() => setMode('json')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${mode === 'json' ? 'bg-slate-800 text-white border border-amber-500/50' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
                        >
                            <FileJson size={18} />
                            JSON Import
                        </button>
                    </div>

                    {mode === 'json' ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white">JSON Import</h3>
                            <p className="text-sm text-slate-400">Savollarni JSON formatida import qiling:</p>
                            <pre className="bg-slate-950 p-3 rounded-lg text-[10px] text-amber-400/80 overflow-x-auto">
                                {`[
  {
    "questionText": "Vaziyat bo'yicha savol?",
    "sampleAnswer": "Ideal javob varianti",
    "explanation": "Nima uchun shunday bo'lishi kerak?"
  }
]`}
                            </pre>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm"
                                rows={10}
                                placeholder="JSON ni bu yerga joylashtiring..."
                            />
                            <button
                                onClick={handleJsonImport}
                                className="w-full py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Upload size={18} />
                                Import Qilish
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <div key={q.questionId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 relative group">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-amber-500">SAVOL {idx + 1}</span>
                                        <button
                                            onClick={() => removeQuestion(q.questionId)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Savol matni *</label>
                                        <textarea
                                            value={q.questionText}
                                            onChange={(e) => updateQuestion(q.questionId, 'questionText', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                                            rows={2}
                                            placeholder="Savolni kiriting..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Ideal Javob (Namuna)</label>
                                            <textarea
                                                value={q.sampleAnswer}
                                                onChange={(e) => updateQuestion(q.questionId, 'sampleAnswer', e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                                                rows={2}
                                                placeholder="Admin ko'rishi uchun namuna..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Tushuntirish</label>
                                            <textarea
                                                value={q.explanation}
                                                onChange={(e) => updateQuestion(q.questionId, 'explanation', e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                                                rows={2}
                                                placeholder="Nima uchun bu savol muhim?"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Rasm URL (Ixtiyoriy)</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                <input
                                                    type="text"
                                                    value={q.imageUrl || ''}
                                                    onChange={(e) => updateQuestion(q.questionId, 'imageUrl', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                                                    placeholder="Rasm linkini kiriting..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addQuestion}
                                className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:border-amber-500/50 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                Yangi savol qo'shish
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
