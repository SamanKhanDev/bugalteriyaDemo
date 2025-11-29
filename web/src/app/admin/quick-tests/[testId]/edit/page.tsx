'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, getDocs, orderBy, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickTest, QuickTestLevel } from '@/lib/schema';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Plus, FileJson, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { use } from 'react';

export default function EditQuickTestPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [certificateThreshold, setCertificateThreshold] = useState<number | undefined>(undefined);
    const [isActive, setIsActive] = useState(true);
    const [activeDate, setActiveDate] = useState<string>('');
    const [activeTimeFrom, setActiveTimeFrom] = useState<string>('');
    const [activeTimeTo, setActiveTimeTo] = useState<string>('');
    const [levels, setLevels] = useState<QuickTestLevel[]>([]);
    const [collapsedLevels, setCollapsedLevels] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadTest();
    }, [testId]);

    const loadTest = async () => {
        try {
            const testDoc = await getDoc(doc(db, 'quickTests', testId));
            if (testDoc.exists()) {
                const testData = testDoc.data() as QuickTest;
                setTitle(testData.title);
                setDescription(testData.description);
                setTimeLimit(testData.timeLimit);
                setCertificateThreshold(testData.certificateThreshold);
                setIsActive(testData.isActive);
                setActiveDate(testData.activeDate || '');
                setActiveTimeFrom(testData.activeTimeFrom || '');
                setActiveTimeTo(testData.activeTimeTo || '');
            }

            const levelsSnapshot = await getDocs(
                query(collection(db, 'quickTests', testId, 'levels'), orderBy('levelNumber'))
            );
            const levelsData = levelsSnapshot.docs.map(doc => ({
                ...doc.data(),
                levelId: doc.id
            })) as QuickTestLevel[];
            setLevels(levelsData);
        } catch (error) {
            console.error('Error loading test:', error);
        } finally {
            setLoading(false);
        }
    };

    const addLevel = () => {
        setLevels([...levels, {
            levelId: crypto.randomUUID(),
            testId,
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

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Imtihon nomini kiriting');
            return;
        }

        setSaving(true);
        try {
            const updateData: any = {
                title,
                description,
                isActive,
                totalLevels: levels.length,
                updatedAt: new Date()
            };

            if (timeLimit !== undefined) {
                updateData.timeLimit = timeLimit;
            }

            if (certificateThreshold !== undefined) {
                updateData.certificateThreshold = certificateThreshold;
            }

            // Add date and time range
            if (activeDate) {
                updateData.activeDate = activeDate;
            } else {
                updateData.activeDate = null;
            }

            if (activeTimeFrom) {
                updateData.activeTimeFrom = activeTimeFrom;
            } else {
                updateData.activeTimeFrom = null;
            }

            if (activeTimeTo) {
                updateData.activeTimeTo = activeTimeTo;
            } else {
                updateData.activeTimeTo = null;
            }

            await updateDoc(doc(db, 'quickTests', testId), updateData);

            const oldLevelsSnapshot = await getDocs(collection(db, 'quickTests', testId, 'levels'));
            for (const levelDoc of oldLevelsSnapshot.docs) {
                await deleteDoc(levelDoc.ref);
            }

            for (const level of levels) {
                const levelData: any = {
                    levelNumber: level.levelNumber,
                    title: level.title,
                    questions: level.questions
                };

                if (level.timeLimit !== undefined) {
                    levelData.timeLimit = level.timeLimit;
                }

                await addDoc(collection(db, 'quickTests', testId, 'levels'), levelData);
            }

            alert('O\'zgarishlar saqlandi!');
            router.push('/admin/quick-tests');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Yuklanmoqda...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Imtihonni Tahrirlash</h1>
                <p className="text-slate-400">Imtihon ma'lumotlarini o'zgartiring</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Sana (ixtiyoriy)
                            </label>
                            <input
                                type="date"
                                value={activeDate}
                                onChange={(e) => setActiveDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                            <p className="text-xs text-slate-500 mt-1">Agar sana belgilanmasa, har kuni ishlaydi</p>
                        </div>

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
                            <p className="text-xs text-slate-500 mt-1">Masalan: 11:00</p>
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
                            <p className="text-xs text-slate-500 mt-1">Masalan: 15:00</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Levels */}
            <div className="space-y-4">
                {levels.map((level) => (
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
                                {/* JSON Import */}
                                <details className="bg-slate-800/50 rounded-xl overflow-hidden">
                                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-cyan-400 hover:bg-slate-800 transition-colors flex items-center gap-2">
                                        <FileJson size={16} />
                                        JSON orqali savollar qo'shish
                                    </summary>
                                    <div className="p-4 border-t border-slate-700">
                                        <p className="text-xs text-slate-400 mb-3">
                                            Quyidagi formatda JSON kiriting (Google Drive linklar avtomatik konvert qilinadi):
                                        </p>
                                        <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 mb-3 overflow-x-auto">
                                            {`[
  {
    "questionText": "Savol matni?",
    "imageUrl": "https://drive.google.com/file/d/FILE_ID/view (ixtiyoriy)",
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
                                                    const importedQuestions = parsed.map((q: any) => {
                                                        let imageUrl = q.imageUrl || '';

                                                        // Auto-convert Google Drive share link to direct image URL
                                                        if (imageUrl.includes('drive.google.com')) {
                                                            // Format 1: /file/d/FILE_ID/view
                                                            let match = imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                                            if (match && match[1]) {
                                                                imageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                                                            } else {
                                                                // Format 2: /open?id=FILE_ID
                                                                match = imageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                                                                if (match && match[1]) {
                                                                    imageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                                                                }
                                                            }
                                                        }

                                                        return {
                                                            questionId: crypto.randomUUID(),
                                                            questionText: q.questionText || q.question,
                                                            imageUrl,
                                                            explanation: q.explanation || '',
                                                            options: q.options.map((opt: any) => ({
                                                                optionId: crypto.randomUUID(),
                                                                text: opt.text,
                                                                isCorrect: opt.isCorrect || false
                                                            }))
                                                        };
                                                    });

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


                                        <div className="mb-3">
                                            <label className="block text-xs text-slate-400 mb-1">
                                                Rasm URL (ixtiyoriy) - Google Drive linkini joylashtiring
                                            </label>
                                            <input
                                                type="text"
                                                value={question.imageUrl || ''}
                                                onChange={(e) => {
                                                    let url = e.target.value.trim();

                                                    // Auto-convert Google Drive share link to direct image URL
                                                    if (url.includes('drive.google.com')) {
                                                        // Format 1: /file/d/FILE_ID/view
                                                        let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                                        if (match && match[1]) {
                                                            url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                                                        } else {
                                                            // Format 2: /open?id=FILE_ID
                                                            match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                                                            if (match && match[1]) {
                                                                url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                                                            }
                                                        }
                                                    }

                                                    updateQuestion(level.levelId, question.questionId, 'imageUrl', url);
                                                }}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                                placeholder="https://drive.google.com/file/d/... yoki to'g'ridan-to'g'ri URL"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                💡 Google Drive: Rasmni "Anyone with the link" ga ochiq qiling va linkni joylashtiring
                                            </p>
                                        </div>


                                        {question.imageUrl && (
                                            <div className="mb-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                                                <p className="text-xs text-slate-400 mb-2">Preview:</p>
                                                <img
                                                    src={question.imageUrl}
                                                    alt="Savol rasmi"
                                                    className="max-w-full h-auto rounded"
                                                    onLoad={(e) => {
                                                        console.log('✅ Admin preview: Rasm yuklandi');
                                                    }}
                                                    onError={(e) => {
                                                        console.error('❌ Admin preview: Rasm yuklanmadi:', question.imageUrl);
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const errorDiv = document.createElement('div');
                                                            errorDiv.className = 'text-center py-4 text-red-400 text-sm';
                                                            errorDiv.innerHTML = '⚠️ Rasm yuklanmadi. Link noto\'g\'ri yoki rasm ochiq emas.';
                                                            e.currentTarget.replaceWith(errorDiv);
                                                        }
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
                                            + Variant qo&apos;shish
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addQuestion(level.levelId)}
                                    className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all"
                                >
                                    + Savol qo&apos;shish
                                </button>
                            </div>
                        )}
                    </div>
                ))
                }

                <button
                    onClick={addLevel}
                    className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Bosqich qo&apos;shish
                </button>
            </div >

            {/* Actions */}
            < div className="flex gap-4" >
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                    Bekor qilish
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div >
        </div >
    );
}
