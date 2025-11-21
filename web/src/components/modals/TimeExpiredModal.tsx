'use client';

import { Clock, AlertCircle } from 'lucide-react';

interface TimeExpiredModalProps {
    onContactAdmin?: () => void;
}

export default function TimeExpiredModal({ onContactAdmin }: TimeExpiredModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-red-900/20">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/30">
                        <Clock size={40} className="text-red-500" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-4">
                    Vaqtingiz Tugadi
                </h2>

                {/* Message */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-300">
                            <p className="mb-2">
                                Platformadan foydalanish uchun vaqtingiz tugagan. Davom etish uchun to'lov qilishingiz kerak.
                            </p>
                            <p className="text-red-400 font-semibold">
                                Iltimos, administrator bilan bog'laning.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Bog'lanish:</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-slate-500">📞</span>
                            <span>+998 90 123 45 67</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-slate-500">✉️</span>
                            <span>admin@accounting.uz</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-slate-500">💬</span>
                            <span>Telegram: @accounting_admin</span>
                        </div>
                    </div>
                </div>

                {/* Button */}
                <button
                    onClick={onContactAdmin}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/20 transition-all"
                >
                    Administrator Bilan Bog'lanish
                </button>

                <p className="text-center text-xs text-slate-500 mt-4">
                    To'lov qilganingizdan keyin vaqtingiz avtomatik yangilanadi
                </p>
            </div>
        </div>
    );
}
