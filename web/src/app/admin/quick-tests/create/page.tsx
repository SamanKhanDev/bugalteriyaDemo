'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Trash2, Save, FileJson, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { QuickTestLevel, QuickTestQuestion, QuickTestOption } from '@/lib/schema';

type InputMode = 'manual' | 'json';

export default function CreateQuickTestPage() {
    const { user } = useStore();
    const router = useRouter();
    const [mode, setMode] = useState<InputMode>('manual');
    const [loading, setLoading] = useState(false);

    // Basic info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [certificateThreshold, setCertificateThreshold] = useState<number | undefined>(undefined);
    const [isActive, setIsActive] = useState(true);
    const [activeStartDate, setActiveStartDate] = useState<string>('');
    const [activeEndDate, setActiveEndDate] = useState<string>('');
    const [activeDate, setActiveDate] = useState<string>('');
    const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
    const [activeTimeFrom, setActiveTimeFrom] = useState<string>('');
    const [activeTimeTo, setActiveTimeTo] = useState<string>('');

    // Manual mode
    const [levels, setLevels] = useState<QuickTestLevel[]>([
        {
            levelId: crypto.randomUUID(),
            testId: '',
            levelNumber: 1,
            title: '1-bosqich',
            questions: [],
            timeLimit: undefined
        }
    ]);

    // Track collapsed levels
    const [collapsedLevels, setCollapsedLevels] = useState<Set<string>>(new Set());

    // JSON mode
    const [jsonInput, setJsonInput] = useState('');

    const addLevel = () => {
        setLevels([...levels, {
            levelId: crypto.randomUUID(),
            testId: '',
            levelNumber: levels.length + 1,
            title: `${levels.length + 1}-bosqich`,
            questions: [],
            timeLimit: undefined
        }]);
    };

    const removeLevel = (levelId: string) => {
        setLevels(levels.filter(l => l.levelId !== levelId));
    };

    const addQuestion = (levelId: string) => {
        setLevels(levels.map(level => {
            if (level.levelId === levelId) {
                return {
                    ...level,
                    questions: [...level.questions, {
                        questionId: crypto.randomUUID(),
                        questionText: '',
                        options: [
                            { optionId: crypto.randomUUID(), text: '', isCorrect: false },
                            { optionId: crypto.randomUUID(), text: '', isCorrect: false },
                        ],
                        explanation: ''
                    }]
                };
            }
            return level;
        }));
    };

    const removeQuestion = (levelId: string, questionId: string) => {
        setLevels(levels.map(level => {
            if (level.levelId === levelId) {
                return {
                    ...level,
                    questions: level.questions.filter(q => q.questionId !== questionId)
                };
            }
            return level;
        }));
    };

    const updateQuestion = (levelId: string, questionId: string, field: string, value: any) => {
        setLevels(levels.map(level => {
            if (level.levelId === levelId) {
                return {
                    ...level,
                    questions: level.questions.map(q => {
                        if (q.questionId === questionId) {
                            return { ...q, [field]: value };
                        }
                        return q;
                    })
                };
            }
            return level;
        }));
    };

    const addOption = (levelId: string, questionId: string) => {
        setLevels(levels.map(level => {
            if (level.levelId === levelId) {
                return {
                    ...level,
                    questions: level.questions.map(q => {
                        if (q.questionId === questionId) {
                            return {
                                ...q,
                                options: [...q.options, {
                                    optionId: crypto.randomUUID(),
                                    text: '',
                                    isCorrect: false
                                }]
                            };
                        }
                        return q;
                    })
                };
            }
            return level;
        }));
    };

    const removeOption = (levelId: string, questionId: string, optionId: string) => {
        setLevels(levels.map(level => {
            if (level.levelId === levelId) {
                return {
                    ...level,
                    questions: level.questions.map(q => {
                        if (q.questionId === questionId) {
                            return {
                                ...q,
                                options: q.options.filter(o => o.optionId !== optionId)
                            };
                        }
                        return q;
                    })
                };
            }
            return level;
        }));
    };

    const updateOption = (levelId: string, questionId: string, optionId: string, field: string, value: any) => {
        setLevels(levels.map(level => {
            if (level.levelId === levelId) {
                return {
                    ...level,
                    questions: level.questions.map(q => {
                        if (q.questionId === questionId) {
                            return {
                                ...q,
                                options: q.options.map(o => {
                                    if (o.optionId === optionId) {
                                        // If marking as correct, unmark others
                                        if (field === 'isCorrect' && value === true) {
                                            return { ...o, isCorrect: true };
                                        }
                                        return { ...o, [field]: value };
                                    } else if (field === 'isCorrect' && value === true) {
                                        return { ...o, isCorrect: false };
                                    }
                                    return o;
                                })
                            };
                        }
                        return q;
                    })
                };
            }
            return level;
        }));
    };

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (Array.isArray(parsed)) {
                const importedLevels: QuickTestLevel[] = parsed.map((level, idx) => ({
                    levelId: crypto.randomUUID(),
                    testId: '',
                    levelNumber: idx + 1,
                    title: level.title || `${idx + 1}-bosqich`,
                    timeLimit: level.timeLimit,
                    questions: level.questions.map((q: any) => ({
                        questionId: crypto.randomUUID(),
                        questionText: q.questionText || q.question,
                        imageUrl: q.imageUrl || '',
                        explanation: q.explanation || '',
                        options: q.options.map((opt: any) => ({
                            optionId: crypto.randomUUID(),
                            text: opt.text,
                            isCorrect: opt.isCorrect || false
                        }))
                    }))
                }));
                setLevels(importedLevels);
                setJsonInput(''); // Clear input after successful import
                alert('JSON muvaffaqiyatli import qilindi! Endi qo\'lda tahrirlashingiz mumkin.');
            } else {
                alert('JSON array formatida bo\'lishi kerak');
            }
        } catch (error) {
            alert('JSON formatida xatolik: ' + (error as Error).message);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('Imtihon nomini kiriting');
            return;
        }

        if (levels.length === 0) {
            alert('Kamida bitta bosqich qo\'shing');
            return;
        }

        // Validate levels
        for (const level of levels) {
            if (level.questions.length === 0) {
                alert(`${level.title} da savollar yo'q`);
                return;
            }
            for (const question of level.questions) {
                if (!question.questionText.trim()) {
                    alert('Barcha savollarni to\'ldiring');
                    return;
                }
                if (question.options.length < 2) {
                    alert('Har bir savolda kamida 2 ta variant bo\'lishi kerak');
                    return;
                }
                if (!question.options.some(o => o.isCorrect)) {
                    alert('Har bir savolda to\'g\'ri javob belgilang');
                    return;
                }
            }
        }

        setLoading(true);
        try {
            // Create test
            const testData: any = {
                title,
                description,
                createdBy: user?.userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                isActive,
                totalLevels: levels.length
            };

            if (timeLimit !== undefined) {
                testData.timeLimit = timeLimit;
            }

            if (certificateThreshold !== undefined) {
                testData.certificateThreshold = certificateThreshold;
            }

            if (activeStartDate) {
                testData.activeStartDate = activeStartDate;
            }

            if (activeEndDate) {
                testData.activeEndDate = activeEndDate;
            }

            if (activeTimeFrom) {
                testData.activeTimeFrom = activeTimeFrom;
            }

            if (activeTimeTo) {
                testData.activeTimeTo = activeTimeTo;
            }

            if (dateMode === 'single' && activeDate) {
                testData.activeDate = activeDate;
                testData.activeStartDate = null;
                testData.activeEndDate = null;
            } else if (dateMode === 'range') {
                testData.activeDate = null;
                if (activeStartDate) testData.activeStartDate = activeStartDate;
                if (activeEndDate) testData.activeEndDate = activeEndDate;
            }

            const testRef = await addDoc(collection(db, 'quickTests'), testData);

            // Create levels
            for (const level of levels) {
                const levelData: any = {
                    levelNumber: level.levelNumber,
                    title: level.title,
                    questions: level.questions
                };

                if (level.timeLimit !== undefined) {
                    levelData.timeLimit = level.timeLimit;
                }

                await addDoc(collection(db, 'quickTests', testRef.id, 'levels'), levelData);
            }

            alert('Imtihon muvaffaqiyatli yaratildi!');
            router.push('/admin/quick-tests');
        } catch (error) {
            console.error('Error creating test:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Yangi Tezkor Imtihon</h1>
                <p className="text-slate-400">Imtihonni qo'lda yoki JSON orqali yarating</p>
            </div>

            {/* Mode Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all ${mode === 'manual'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Edit3 size={20} />
                        Qo'lda Yaratish
                    </button>
                    <button
                        onClick={() => setMode('json')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all ${mode === 'json'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <FileJson size={20} />
                        JSON Import
                    </button>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Imtihon Nomi *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="Masalan: Buxgalteriya Asoslari"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tavsif
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            rows={3}
                            placeholder="Imtihon haqida qisqacha ma'lumot"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Vaqt Limiti (daqiqa)
                            </label>
                            <input
                                type="number"
                                value={timeLimit ? Math.floor(timeLimit / 60) : ''}
                                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) * 60 : undefined)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Ixtiyoriy"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Sertifikat uchun minimal foiz (%)
                            </label>
                            <input
                                type="number"
                                value={certificateThreshold || ''}
                                onChange={(e) => setCertificateThreshold(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Masalan: 80"
                                min="0"
                                max="100"
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                                />
                                <span className="text-slate-300">Faol</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex gap-4 p-1 bg-slate-800 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setDateMode('single')}
                                className={`px-4 py-1.5 rounded-md text-sm transition-all ${dateMode === 'single' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Bir kunlik
                            </button>
                            <button
                                type="button"
                                onClick={() => setDateMode('range')}
                                className={`px-4 py-1.5 rounded-md text-sm transition-all ${dateMode === 'range' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Kunlar oralig'i
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {dateMode === 'single' ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Sana
                                    </label>
                                    <input
                                        type="date"
                                        value={activeDate}
                                        onChange={(e) => setActiveDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Boshlanish sanasi
                                        </label>
                                        <input
                                            type="date"
                                            value={activeStartDate}
                                            onChange={(e) => setActiveStartDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Tugash sanasi
                                        </label>
                                        <input
                                            type="date"
                                            value={activeEndDate}
                                            onChange={(e) => setActiveEndDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Boshlanish vaqti
                                </label>
                                <input
                                    type="time"
                                    value={activeTimeFrom}
                                    onChange={(e) => setActiveTimeFrom(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tugash vaqti
                                </label>
                                <input
                                    type="time"
                                    value={activeTimeTo}
                                    onChange={(e) => setActiveTimeTo(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                    {(activeStartDate || activeEndDate || activeDate || activeTimeFrom || activeTimeTo) && (
                        <p className="text-xs text-slate-500">
                            💡 Test faqat belgilangan {dateMode === 'single' ? 'kunda' : 'kunlar oralig\'ida'} va vaqtda faol bo'ladi.
                        </p>
                    )}
                </div>
            </div>

            {/* JSON Mode */}
            {mode === 'json' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">JSON Format</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Quyidagi formatda JSON kiriting:
                    </p>
                    <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 mb-4 overflow-x-auto">
                        {`[
  {
    "title": "1-bosqich",
    "timeLimit": 600,
    "questions": [
      {
        "questionText": "Savol matni?",
        "imageUrl": "https://drive.google.com/uc?id=FILE_ID (ixtiyoriy)",
        "explanation": "Tushuntirish (ixtiyoriy)",
        "options": [
          { "text": "Variant 1", "isCorrect": false },
          { "text": "To'g'ri javob", "isCorrect": true }
        ]
      }
    ]
  }
]`}
                    </pre>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
                        rows={12}
                        placeholder="JSON ni bu yerga joylashtiring..."
                    />
                    <button
                        onClick={handleJsonImport}
                        className="mt-4 flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
                    >
                        <Upload size={20} />
                        Import Qilish
                    </button>
                </div>
            )}

            {/* Levels Display - Shows for both modes */}
            {levels.length > 0 && (
                <div className="space-y-4">
                    {levels.map((level, levelIdx) => (
                        <div key={level.levelId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-cyan-400 font-bold">{level.levelNumber}</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={level.title}
                                        onChange={(e) => {
                                            setLevels(levels.map(l =>
                                                l.levelId === level.levelId
                                                    ? { ...l, title: e.target.value }
                                                    : l
                                            ));
                                        }}
                                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:border-cyan-500 transition-colors"
                                        placeholder={`${level.levelNumber}-bosqich nomi (masalan: Moliya, Qonunlar)`}
                                    />
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <span>{level.questions.length} savol</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <button
                                        onClick={() => {
                                            const newCollapsed = new Set(collapsedLevels);
                                            if (newCollapsed.has(level.levelId)) {
                                                newCollapsed.delete(level.levelId);
                                            } else {
                                                newCollapsed.add(level.levelId);
                                            }
                                            setCollapsedLevels(newCollapsed);
                                        }}
                                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                        title={collapsedLevels.has(level.levelId) ? "Ochish" : "Yig'ish"}
                                    >
                                        {collapsedLevels.has(level.levelId) ? (
                                            <ChevronDown size={18} />
                                        ) : (
                                            <ChevronUp size={18} />
                                        )}
                                    </button>
                                    {levels.length > 1 && (
                                        <button
                                            onClick={() => removeLevel(level.levelId)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!collapsedLevels.has(level.levelId) && (

                                <div className="space-y-4">
                                    {/* JSON Import for this level */}
                                    <details className="bg-slate-800/50 rounded-xl overflow-hidden">
                                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-cyan-400 hover:bg-slate-800 transition-colors flex items-center gap-2">
                                            <FileJson size={16} />
                                            JSON orqali savollar qo'shish
                                        </summary>
                                        <div className="p-4 border-t border-slate-700">
                                            <p className="text-xs text-slate-400 mb-3">
                                                Quyidagi formatda JSON kiriting:
                                            </p>
                                            <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 mb-3 overflow-x-auto">
                                                {`[
  {
    "questionText": "Savol matni?",
    "explanation": "Tushuntirish",
    "options": [
      { "text": "Variant 1", "isCorrect": false },
      { "text": "To'g'ri javob", "isCorrect": true }
    ]
  }
]`}
                                            </pre>
                                            <textarea
                                                id={`json-${level.levelId}`}
                                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono text-xs"
                                                rows={6}
                                                placeholder="JSON ni bu yerga joylashtiring..."
                                            />
                                            <button
                                                onClick={() => {
                                                    const textarea = document.getElementById(`json-${level.levelId}`) as HTMLTextAreaElement;
                                                    const jsonText = textarea?.value;
                                                    if (!jsonText) {
                                                        alert('JSON kiriting');
                                                        return;
                                                    }
                                                    try {
                                                        const parsed = JSON.parse(jsonText);
                                                        if (!Array.isArray(parsed)) {
                                                            alert('JSON array formatida bo\'lishi kerak');
                                                            return;
                                                        }
                                                        const importedQuestions = parsed.map((q: any) => ({
                                                            questionId: crypto.randomUUID(),
                                                            questionText: q.questionText || q.question,
                                                            explanation: q.explanation || '',
                                                            options: q.options.map((opt: any) => ({
                                                                optionId: crypto.randomUUID(),
                                                                text: opt.text,
                                                                isCorrect: opt.isCorrect || false
                                                            }))
                                                        }));

                                                        setLevels(levels.map(l =>
                                                            l.levelId === level.levelId
                                                                ? { ...l, questions: [...l.questions, ...importedQuestions] }
                                                                : l
                                                        ));
                                                        textarea.value = '';
                                                        alert(`${importedQuestions.length} ta savol qo'shildi!`);
                                                    } catch (error) {
                                                        alert('JSON formatida xatolik: ' + (error as Error).message);
                                                    }
                                                }}
                                                className="mt-3 flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                                            >
                                                <Upload size={16} />
                                                Import Qilish
                                            </button>
                                        </div>
                                    </details>

                                    {level.questions.map((question, qIdx) => (
                                        <div key={question.questionId} className="bg-slate-800 rounded-xl p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-sm font-medium text-slate-400">
                                                    Savol {qIdx + 1}
                                                </span>
                                                <button
                                                    onClick={() => removeQuestion(level.levelId, question.questionId)}
                                                    className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <input
                                                type="text"
                                                value={question.questionText}
                                                onChange={(e) => updateQuestion(level.levelId, question.questionId, 'questionText', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors mb-3"
                                                placeholder="Savol matni"
                                            />

                                            <input
                                                type="text"
                                                value={question.imageUrl || ''}
                                                onChange={(e) => updateQuestion(level.levelId, question.questionId, 'imageUrl', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors mb-3"
                                                placeholder="Rasm URL (Google Drive link - ixtiyoriy)"
                                            />

                                            {question.imageUrl && (
                                                <div className="mb-3 p-2 bg-slate-900 rounded-lg border border-slate-700">
                                                    <img
                                                        src={question.imageUrl}
                                                        alt="Savol rasmi"
                                                        className="max-w-full h-auto rounded"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2 mb-3">
                                                {question.options.map((option, optIdx) => (
                                                    <div key={option.optionId} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            checked={option.isCorrect}
                                                            onChange={() => updateOption(level.levelId, question.questionId, option.optionId, 'isCorrect', true)}
                                                            className="w-4 h-4 text-green-500 focus:ring-green-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={option.text}
                                                            onChange={(e) => updateOption(level.levelId, question.questionId, option.optionId, 'text', e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                                                            placeholder={`Variant ${optIdx + 1}`}
                                                        />
                                                        {question.options.length > 2 && (
                                                            <button
                                                                onClick={() => removeOption(level.levelId, question.questionId, option.optionId)}
                                                                className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => addOption(level.levelId, question.questionId)}
                                                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                            >
                                                + Variant qo'shish
                                            </button>

                                            <input
                                                type="text"
                                                value={question.explanation || ''}
                                                onChange={(e) => updateQuestion(level.levelId, question.questionId, 'explanation', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors mt-3 text-sm"
                                                placeholder="Tushuntirish (ixtiyoriy)"
                                            />
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => addQuestion(level.levelId)}
                                        className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all"
                                    >
                                        + Savol qo'shish
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={addLevel}
                        className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Bosqich qo'shish
                    </button>
                </div>
            )}

            {/* Submit */}
            <div className="flex gap-4">
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                    Bekor qilish
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                    <Save size={20} />
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div>
        </div>
    );
}
