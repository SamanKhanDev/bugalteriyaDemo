'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { QuickTest } from '@/lib/schema';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, LogIn, UserPlus, Zap, AlertCircle } from 'lucide-react';
import { use } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { generateUniqueId } from '@/lib/generateUniqueId';


type AuthMode = 'guest' | 'register' | 'login';

export default function PublicQuickTestPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = use(params);
    const router = useRouter();
    const [test, setTest] = useState<QuickTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [authMode, setAuthMode] = useState<AuthMode | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Guest mode
    const [guestName, setGuestName] = useState('');

    // Register mode
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    // Login mode
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    useEffect(() => {
        // Check if user is already logged in
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push(`/quick-tests/${testId}`);
            } else {
                setAuthLoading(false);
            }
        });

        return () => unsubscribe();
    }, [testId, router]);

    useEffect(() => {
        loadTest();
    }, [testId]);

    const loadTest = async () => {
        try {
            const testDoc = await getDoc(doc(db, 'quickTests', testId));
            if (!testDoc.exists()) {
                alert('Imtihon topilmadi');
                return;
            }

            const testData = { ...testDoc.data(), testId: testDoc.id } as QuickTest;

            if (!testData.isActive) {
                alert('Bu imtihon hozirda faol emas');
                return;
            }

            setTest(testData);
        } catch (error) {
            console.error('Error loading test:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestStart = () => {
        if (!guestName.trim()) {
            alert('Ism va familyangizni kiriting');
            return;
        }

        // Create temporary guest user data in localStorage
        const guestUser = {
            userId: `guest_${Date.now()}`,
            name: guestName,
            email: `guest_${Date.now()}@temp.com`,
            isGuest: true
        };

        localStorage.setItem('guestUser', JSON.stringify(guestUser));
        router.push(`/quick-tests/${testId}`);
    };

    const handleRegister = async () => {
        if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
            alert('Barcha maydonlarni to\'ldiring');
            return;
        }

        if (regPassword.length < 6) {
            alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
            return;
        }

        setSubmitting(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
            const user = userCredential.user;

            // Generate unique 6-digit ID
            const uniqueId = await generateUniqueId();

            await setDoc(doc(db, 'users', user.uid), {
                userId: user.uid,
                uniqueId: uniqueId,
                name: regName,
                email: regEmail,
                role: 'user',
                createdAt: Timestamp.now(),
                totalActiveSeconds: 0,
                lastSeen: Timestamp.now()
            });

            router.push(`/quick-tests/${testId}`);
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert('Bu email allaqachon ro\'yxatdan o\'tgan');
            } else {
                alert('Ro\'yxatdan o\'tishda xatolik');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogin = async () => {
        if (!loginEmail.trim() || !loginPassword.trim()) {
            alert('Email va parolni kiriting');
            return;
        }

        setSubmitting(true);
        try {
            await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            router.push(`/quick-tests/${testId}`);
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                alert('Email yoki parol noto\'g\'ri');
            } else {
                alert('Kirishda xatolik');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <p className="text-slate-400">Imtihon topilmadi</p>
            </div>
        );
    }

    if (!authMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    {/* Notification Banner */}
                    <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3 overflow-hidden">
                        <AlertCircle className="text-yellow-500 flex-shrink-0" size={24} />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-yellow-200/90 text-sm md:text-base leading-relaxed animate-marquee whitespace-nowrap">
                                Imtihonga kirish uchun va undan to'lov qilib to'liq foydalanishiz uchun to'liq ro'yxatdan o'tishiz talab qilinadi.
                            </p>
                        </div>
                    </div>

                    {/* Test Info */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                            <Zap size={16} />
                            Tezkor Imtihon
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{test.title}</h1>
                        <p className="text-xl text-slate-300 mb-6">{test.description}</p>
                        <div className="flex items-center justify-center gap-6 text-slate-400">
                            <span>{test.totalLevels} bosqich</span>
                            {test.timeLimit && <span>{Math.floor(test.timeLimit / 60)} daqiqa</span>}
                        </div>
                    </div>

                    {/* Auth Options */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Guest Mode */}
                        <button
                            onClick={() => setAuthMode('guest')}
                            className="group bg-slate-900/50 backdrop-blur border-2 border-slate-800 hover:border-cyan-500 rounded-2xl p-8 transition-all hover:scale-105"
                        >
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 transition-colors">
                                <Zap className="text-cyan-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Tez Kirish</h3>
                            <p className="text-slate-400 text-sm">
                                Faqat ism-familya bilan kirish
                            </p>
                        </button>

                        {/* Register Mode - Highlighted */}
                        <button
                            onClick={() => setAuthMode('register')}
                            className="relative group bg-gradient-to-br from-slate-900/80 to-purple-900/20 backdrop-blur border-2 border-purple-500/50 hover:border-purple-500 rounded-2xl p-8 transition-all hover:scale-105 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/30"
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                TAVSIYA ETILADI
                            </div>
                            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/20 transition-colors relative">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-2xl animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <UserPlus className="text-purple-400 relative z-10" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Ro'yxatdan O'tish</h3>
                            <p className="text-slate-400 text-sm">
                                To'liq ro'yxatdan o'tish va platformaga kirish
                            </p>
                        </button>

                        {/* Login Mode */}
                        <button
                            onClick={() => setAuthMode('login')}
                            className="group bg-slate-900/50 backdrop-blur border-2 border-slate-800 hover:border-green-500 rounded-2xl p-8 transition-all hover:scale-105"
                        >
                            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
                                <LogIn className="text-green-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Kirish</h3>
                            <p className="text-slate-400 text-sm">
                                Mavjud akkaunt bilan kirish
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Auth Forms
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <button
                    onClick={() => setAuthMode(null)}
                    className="text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    ← Orqaga
                </button>

                <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        {authMode === 'guest' && 'Tez Kirish'}
                        {authMode === 'register' && 'Ro\'yxatdan O\'tish'}
                        {authMode === 'login' && 'Kirish'}
                    </h2>

                    {/* Guest Form */}
                    {authMode === 'guest' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Ism va Familya
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        placeholder="Masalan: Alisher Navoiy"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleGuestStart}
                                disabled={submitting}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
                            >
                                Imtihonni Boshlash
                            </button>
                            <p className="text-xs text-slate-400 text-center">
                                Natijalaringiz vaqtinchalik saqlanadi
                            </p>
                        </div>
                    )}

                    {/* Register Form */}
                    {authMode === 'register' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Ism va Familya
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="text"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="Masalan: Alisher Navoiy"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Parol
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="password"
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="Kamida 6 ta belgi"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleRegister}
                                disabled={submitting}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Yuklanmoqda...' : 'Ro\'yxatdan O\'tish'}
                            </button>
                            <p className="text-xs text-slate-400 text-center">
                                Platformaga to'liq kirish huquqi beriladi
                            </p>
                        </div>
                    )}

                    {/* Login Form */}
                    {authMode === 'login' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Parol
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors"
                                        placeholder="Parolingiz"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleLogin}
                                disabled={submitting}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Yuklanmoqda...' : 'Kirish'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
