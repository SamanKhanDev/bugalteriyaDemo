'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Save, Plus, Trash2, Loader2, Keyboard } from 'lucide-react';
import Link from 'next/link';

interface OptionData {
    text: string;
    isCorrect: boolean;
}

export default function CreateQuestionPage() {
    const params = useParams();
    const router = useRouter();
    const stageId = params.stageId as string;

    const [loading, setLoading] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const [explanation, setExplanation] = useState('');
    const [order, setOrder] = useState('1');
    const [options, setOptions] = useState<OptionData[]>([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
    ]);

    const handleAddOption = () => {
        setOptions([...options, { text: '', isCorrect: false }]);
        setTimeout(() => {
            const inputs = document.querySelectorAll('input[placeholder^="Variant"]');
            const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
            lastInput?.focus();
        }, 100);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) {
            alert('Kamida 2 ta variant bo\'lishi kerak!');
            return;
        }
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
        const newOptions = [...options];
        if (field === 'isCorrect' && value === true) {
            newOptions.forEach((opt, i) => {
                opt.isCorrect = i === index;
            });
        } else {
            newOptions[index][field] = value as any;
        }
        setOptions(newOptions);
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (index === options.length - 1 && options[index].text.trim()) {
                handleAddOption();
            } else if (index < options.length - 1) {
                const inputs = document.querySelectorAll('input[placeholder^="Variant"]');
                const nextInput = inputs[index + 1] as HTMLInputElement;
                nextInput?.focus();
            }
        } else if (e.key === 'Backspace' && !options[index].text && options.length > 2) {
            e.preventDefault();
            handleRemoveOption(index);
            if (index > 0) {
                setTimeout(() => {
                    const inputs = document.querySelectorAll('input[placeholder^="Variant"]');
                    const prevInput = inputs[index - 1] as HTMLInputElement;
                    prevInput?.focus();
                }, 100);
            }
        } else if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
            const optionIndex = parseInt(e.key) - 1;
            if (optionIndex < options.length) {
                e.preventDefault();
                handleOptionChange(optionIndex, 'isCorrect', true);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!questionText.trim()) {
            alert('Savol matnini kiriting!');
            return;
        }

        const filledOptions = options.filter(opt => opt.text.trim());
        if (filledOptions.length < 2) {
            alert('Kamida 2 ta variant kiriting!');
            return;
        }

        const hasCorrectAnswer = filledOptions.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer) {
            alert('To\'g\'ri javobni belgilang!');
            return;
        }

        setLoading(true);

        try {
            const questionData = {
                questionText: questionText.trim(),
                explanation: explanation.trim() || null,
                order: parseInt(order)
            };

            const questionRef = await addDoc(
                collection(db, 'testStages', stageId, 'questions'),
                questionData
            );

            for (const option of filledOptions) {
                await addDoc(
                    collection(db, 'testStages', stageId, 'questions', questionRef.id, 'options'),
                    {
                        text: option.text.trim(),
                        isCorrect: option.isCorrect
                    }
                );
            }

            await updateDoc(doc(db, 'testStages', stageId), {
                totalQuestions: increment(1)
            });

            const addAnother = confirm('Savol qo\'shildi! Yana savol qo\'shasizmi?');
            if (addAnother) {
                setQuestionText('');
                setExplanation('');
                setOrder((parseInt(order) + 1).toString());
                setOptions([
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]);
                setTimeout(() => {
                    const questionInput = document.querySelector('textarea') as HTMLTextAreaElement;
                    questionInput?.focus();
                }, 100);
            } else {
                router.push(`/admin/tests/${stageId}/edit`);
            }
        } catch (error) {
            console.error('Error creating question:', error);
            alert('Xatolik yuz berdi!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href={`/admin/tests/${stageId}/edit`}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-400" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white">Yangi Savol Qo'shish</h1>
                    <p className="text-slate-400">Savol va javob variantlarini kiriting</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Keyboard size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Enter - Keyingi | Ctrl+1-9 - To'g'ri javob</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Savol matni *
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        placeholder="Savolingizni kiriting..."
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tartib raqami
                        </label>
                        <input
                            type="number"
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            min="1"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tushuntirish (ixtiyoriy)
                        </label>
                        <input
                            type="text"
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="Qisqacha tushuntirish..."
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-slate-300">
                            Javob variantlari *
                        </label>
                        <button
                            type="button"
                            onClick={handleAddOption}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all text-sm"
                        >
                            <Plus size={16} />
                            Variant qo'shish
                        </button>
                    </div>

                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                                <div className="flex items-center pt-3">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={option.isCorrect}
                                        onChange={() => handleOptionChange(index, 'isCorrect', true)}
                                        className="w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                                        title={`To'g'ri javob (Ctrl+${index + 1})`}
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                        onKeyDown={(e) => handleOptionKeyDown(e, index)}
                                        placeholder={`Variant ${index + 1}`}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                </div>
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                            <Keyboard size={14} />
                            <span><strong>Enter</strong> - Keyingi variant | <strong>Backspace</strong> - Bo'sh variantni o'chirish | <strong>Ctrl+1-9</strong> - To'g'ri javob</span>
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
                    <Link
                        href={`/admin/tests/${stageId}/edit`}
                        className="px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                    >
                        Bekor qilish
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
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
        </div>
    );
}
