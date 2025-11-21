'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is admin
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                // AuthProvider will redirect to /admin
            } else {
                await auth.signOut();
                setError('Siz admin emassiz. Iltimos, oddiy kirish sahifasidan foydalaning.');
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError('Email yoki parol noto\'g\'ri');
            } else {
                setError('Tizimga kirishda xatolik yuz berdi');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-900/20">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
                    <p className="text-slate-400">Tizim boshqaruvchisi sifatida kiring</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Parol</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Tekshirilmoqda...
                                </>
                            ) : (
                                'Kirish'
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/auth/login" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
                        Oddiy foydalanuvchi sifatida kirish
                    </Link>
                </div>
            </div>
        </div>
    );
}
