'use client';

import { useState } from 'react';
import { doc, updateDoc, increment, Timestamp, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/schema';

interface AddTimeModalProps {
    user: User;
    onClose: () => void;
}

export default function AddTimeModal({ user, onClose }: AddTimeModalProps) {
    const [minutes, setMinutes] = useState(60);
    const [loading, setLoading] = useState(false);

    const handleAddTime = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const secondsToAdd = minutes * 60;
            const timerRef = doc(db, 'userTimers', user.userId);

            // Check if timer exists
            const timerSnap = await getDoc(timerRef);

            console.log('🔍 Timer exists:', timerSnap.exists());
            if (timerSnap.exists()) {
                const currentTime = timerSnap.data().remainingTime;
                console.log('⏰ Current time:', currentTime, 'seconds');
                console.log('➕ Adding:', secondsToAdd, 'seconds');
                console.log('🎯 Expected new time:', currentTime + secondsToAdd, 'seconds');
            }

            if (!timerSnap.exists()) {
                // Create new timer if it doesn't exist
                console.log('📝 Creating new timer with', secondsToAdd, 'seconds');
                await setDoc(timerRef, {
                    userId: user.userId,
                    remainingTime: secondsToAdd,
                    lastSyncedAt: Timestamp.now(),
                    history: [{
                        type: 'admin_add',
                        seconds: secondsToAdd,
                        reason: 'Admin manual add (initial)',
                        at: Timestamp.now(),
                        adminId: 'current-admin'
                    }]
                });
            } else {
                // Update existing timer
                console.log('🔄 Updating existing timer with increment');
                await updateDoc(timerRef, {
                    remainingTime: increment(secondsToAdd),
                    history: arrayUnion({
                        type: 'admin_add',
                        seconds: secondsToAdd,
                        reason: 'Admin manual add',
                        at: Timestamp.now(),
                        adminId: 'current-admin'
                    })
                });
            }

            // Verify the update
            const updatedSnap = await getDoc(timerRef);
            if (updatedSnap.exists()) {
                console.log('✅ Updated time:', updatedSnap.data().remainingTime, 'seconds');
            }

            alert(`${minutes} daqiqa muvaffaqiyatli qo'shildi!`);
            onClose();
        } catch (error) {
            console.error('❌ Error adding time:', error);
            alert('Vaqt qo\'shishda xatolik: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Add Time for {user.name}</h2>

                <form onSubmit={handleAddTime}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Minutes to Add</label>
                        <input
                            type="number"
                            min="1"
                            value={minutes}
                            onChange={(e) => setMinutes(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                        <div className="flex gap-2 mt-2">
                            {[30, 60, 120].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMinutes(m)}
                                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                    +{m}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Time'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
