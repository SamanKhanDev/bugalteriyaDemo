'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateStagePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        stageNumber: '',
        title: '',
        description: '',
        videoUrl: '',
        videoRequiredPercent: '',
        totalQuestions: '',
        isLocked: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const stageData = {
                stageNumber: parseInt(formData.stageNumber),
                title: formData.title,
                description: formData.description,
                videoUrl: formData.videoUrl || null,
                videoRequiredPercent: formData.videoRequiredPercent ? parseInt(formData.videoRequiredPercent) : null,
                totalQuestions: parseInt(formData.totalQuestions) || 0,
                isLocked: formData.isLocked,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'testStages'), stageData);

            alert('Bosqich muvaffaqiyatli yaratildi!');
            router.push('/admin/tests');
        } catch (error) {
            console.error('Error creating stage:', error);
            alert('Xatolik yuz berdi!');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

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
                    <h1 className="text-3xl font-bold text-white">Yangi Bosqich Yaratish</h1>
                    <p className="text-slate-400">Test bosqichi ma'lumotlarini kiriting</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stage Number */}
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
                            placeholder="1"
                        />
                    </div>

                    {/* Total Questions */}
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
                            placeholder="10"
                        />
                    </div>

                    {/* Title */}
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
                            placeholder="Bosqich 1: Asosiy tushunchalar"
                        />
                    </div>

                    {/* Description */}
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
                            placeholder="Ushbu bosqichda..."
                        />
                    </div>

                    {/* Video URL */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Video URL (YouTube yoki boshqa)
                        </label>
                        <input
                            type="url"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                    </div>

                    {/* Video Required Percent */}
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
                            placeholder="80"
                        />
                        <p className="text-xs text-slate-500 mt-1">Testni boshlash uchun minimal ko'rish foizi</p>
                    </div>

                    {/* Is Locked */}
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
