'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, UserTimer } from '@/lib/schema';
import { generateUniqueId } from '@/lib/generateUniqueId';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Update Profile
            await updateProfile(user, { displayName: formData.name });

            // 3. Generate unique 6-digit ID
            const uniqueId = await generateUniqueId();

            // 4. Create User Document in Firestore
            const userDoc: User = {
                userId: user.uid,
                uniqueId: uniqueId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                createdAt: Timestamp.now(),
                role: 'user', // Default role
                totalActiveSeconds: 0,
                lastSeen: Timestamp.now()
            };

            await setDoc(doc(db, 'users', user.uid), userDoc);

            // 4. Create User Timer Document (2 hours = 7200 seconds)
            // Check if timer already exists to prevent accidental reset
            const timerRef = doc(db, 'userTimers', user.uid);
            const timerSnap = await getDoc(timerRef);

            if (!timerSnap.exists()) {
                const timerDoc: UserTimer = {
                    userId: user.uid,
                    remainingTime: 7200,
                    lastSyncedAt: Timestamp.now(),
                    history: [{
                        type: 'init',
                        seconds: 7200,
                        reason: 'Initial registration',
                        at: Timestamp.now()
                    }]
                };

                await setDoc(timerRef, timerDoc);
            }

            // 5. Create Initial Progress Document (Optional but good practice)
            await setDoc(doc(db, 'userProgress', user.uid), {
                userId: user.uid,
                currentStageId: 'stage-1', // Assuming stage-1 exists or will exist
                completedStages: [],
                perStage: {},
                totalCorrect: 0,
                totalWrong: 0
            });

            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already registered');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Ro'yxatdan o'tish</h1>
                    <p className="text-slate-400">Professional buxgalteriya kursini boshlang</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">To'liq ismingiz</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                            placeholder="Masalan: Ali Valiyev"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email manzili</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                            placeholder="example@mail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Telefon raqami (ixtiyoriy)</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                            placeholder="+998 90 123 45 67"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Yuklanmoqda...
                            </span>
                        ) : (
                            "Ro'yxatdan o'tish"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Akkauntingiz bormi?{' '}
                    <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                        Kirish
                    </Link>
                </div>
            </div>
        </div>
    );
}
