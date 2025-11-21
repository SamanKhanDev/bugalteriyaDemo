'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question } from '@/lib/schema';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OptionData {
    id?: string;
    text: string;
    isCorrect: boolean;
}

export default function EditQuestionPage() {
    const params = useParams();
    const router = useRouter();
    const stageId = params.stageId as string;
    const questionId = params.questionId as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const [explanation, setExplanation] = useState('');
    const [order, setOrder] = useState('1');
    const [options, setOptions] = useState<OptionData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const questionDoc = await getDoc(doc(db, 'testStages', stageId, 'questions', questionId));
                if (questionDoc.exists()) {
                    const data = questionDoc.data() as Question;
                    setQuestionText(data.questionText);
                    setExplanation(data.explanation || '');
                    setOrder(data.order.toString());
                }

                const optionsSnap = await getDocs(collection(db, 'testStages', stageId, 'questions', questionId, 'options'));
                const optionsData: OptionData[] = optionsSnap.docs.map(d => ({
                    id: d.id,
                    text: d.data().text || '',
                    isCorrect: d.data().isCorrect || false
                }));

                setOptions(optionsData.length > 0 ? optionsData : [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]);
            } catch (error) {
                console.error('Error fetching question:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stageId, questionId]);

    const handleAddOption = () => {
        setOptions([...options, { text: '', isCorrect: false }]);
    };

    const handleRemoveOption = async (index: number) => {
        if (options.length <= 2) {
            alert('Kamida 2 ta variant bo\'lishi kerak!');
            return;
        }

        const option = options[index];
        if (option.id) {
            try {
                await deleteDoc(doc(db, 'testStages', stageId, 'questions', questionId, 'options', option.id));
            } catch (error) {
                console.error('Error deleting option:', error);
            }
        }

        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionTextChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleOptionCorrectChange = (index: number) => {
        const newOptions = [...options];
        newOptions.forEach((opt, i) => {
            opt.isCorrect = i === index;
        });
        setOptions(newOptions);
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

        setSaving(true);

        try {
            await updateDoc(doc(db, 'testStages', stageId, 'questions', questionId), {
                questionText: questionText.trim(),
                explanation: explanation.trim() || null,
                order: parseInt(order)
            });

            for (const option of filledOptions) {
                const optionData = {
                    text: option.text.trim(),
                    isCorrect: option.isCorrect
                };

                if (option.id) {
                    await updateDoc(
                        doc(db, 'testStages', stageId, 'questions', questionId, 'options', option.id),
                        optionData
                    );
                } else {
                    await addDoc(
                        collection(db, 'testStages', stageId, 'questions', questionId, 'options'),
                        optionData
                    );
                }
            }

            alert('Savol muvaffaqiyatli yangilandi!');
            router.push(`/admin/tests/${stageId}/edit`);
        } catch (error) {
            console.error('Error updating question:', error);
            alert('Xatolik yuz berdi!');
        } finally {
            setSaving(false);
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
                    href={`/admin/tests/${stageId}/edit`}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Savolni Tahrirlash</h1>
                    <p className="text-slate-400">Savol va javob variantlarini yangilang</p>
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
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tartib raqami
                    </label>
                    <input
                        type="number"
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        min="1"
                        className="w-full md:w-48 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tushuntirish (ixtiyoriy)
                    </label>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        placeholder="Javob tushuntirishini kiriting..."
                    />
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
                            <div key={index} className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                <div className="flex items-center pt-3">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={option.isCorrect}
                                        onChange={() => handleOptionCorrectChange(index)}
                                        className="w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500/50"
                                        title="To'g'ri javob"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                        placeholder={`Variant ${index + 1}`}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                </div>
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        ✓ To'g'ri javobni belgilash uchun radio tugmasini bosing
                    </p>
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
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
    );
}
