'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User, UserProgress, Certificate } from '@/lib/schema';
import { Award, Loader2, Download } from 'lucide-react';

interface EligibleUser {
    user: User & { id: string };
    progress: UserProgress;
    hasCertificate: boolean;
    certificate?: Certificate & { id: string };
}

export default function AdminCertificatesPage() {
    const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState<string | null>(null);

    useEffect(() => {
        fetchEligibleUsers();
    }, []);

    const fetchEligibleUsers = async () => {
        try {
            console.log('🔍 Fetching eligible users...');

            // Fetch all users
            const usersSnap = await getDocs(collection(db, 'users'));
            const users = usersSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as User & { id: string }));
            console.log(`📊 Total users: ${users.length}`);

            // Fetch all test stages to know total count
            const stagesSnap = await getDocs(collection(db, 'testStages'));
            const totalStages = stagesSnap.size;
            console.log(`📚 Total stages: ${totalStages}`);

            // Fetch all certificates
            const certificatesSnap = await getDocs(collection(db, 'certificates'));
            const certificates = certificatesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Certificate & { id: string }));
            console.log(`🎓 Total certificates: ${certificates.length}`);

            const eligible: EligibleUser[] = [];

            for (const user of users) {
                if (user.role === 'admin') continue;

                // Fetch user progress
                const progressDoc = await getDoc(doc(db, 'userProgress', user.id));
                if (!progressDoc.exists()) {
                    console.log(`⚠️ No progress for user: ${user.name}`);
                    continue;
                }

                const progress = progressDoc.data() as UserProgress;
                const completedCount = progress.completedStages?.length || 0;

                console.log(`👤 ${user.name}: ${completedCount}/${totalStages} stages completed`);

                // Check if user completed all stages
                if (completedCount >= totalStages && totalStages > 0) {
                    const userCert = certificates.find(c => c.userId === user.id);
                    eligible.push({
                        user,
                        progress,
                        hasCertificate: !!userCert,
                        certificate: userCert
                    });
                    console.log(`✅ ${user.name} is eligible!`);
                }
            }

            console.log(`🎯 Total eligible users: ${eligible.length}`);
            setEligibleUsers(eligible);
        } catch (error) {
            console.error('❌ Error fetching eligible users:', error);
        } finally {
            setLoading(false);
        }
    };

    const issueCertificate = async (eligibleUser: EligibleUser) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        setIssuing(eligibleUser.user.id);
        try {
            const certificateNumber = `CERT-${Date.now()}-${eligibleUser.user.id.substring(0, 6).toUpperCase()}`;

            const certificateData = {
                userId: eligibleUser.user.id,
                userName: eligibleUser.user.name,
                issuedAt: new Date(),
                issuedBy: currentUser.uid,
                certificateNumber,
                completionDate: new Date(),
                totalStages: eligibleUser.progress.completedStages.length,
                totalScore: eligibleUser.progress.totalCorrect
            };

            console.log('📝 Creating certificate document...');
            const certRef = await addDoc(collection(db, 'certificates'), certificateData);
            console.log('✅ Certificate created with ID:', certRef.id);

            // Log admin action
            console.log('📝 Logging admin action...');
            await addDoc(collection(db, 'adminActions'), {
                adminId: currentUser.uid,
                actionType: 'issue_certificate',
                targetUserId: eligibleUser.user.id,
                payload: { certificateId: certRef.id, certificateNumber },
                createdAt: new Date()
            });
            console.log('✅ Admin action logged');

            // Create notification for user
            console.log('📝 Creating notification...');
            await addDoc(collection(db, 'notifications'), {
                userId: eligibleUser.user.id,
                type: 'certificate',
                title: 'Sertifikat berildi!',
                message: 'Tabriklaymiz! Sizga kursni muvaffaqiyatli tugatganingiz uchun sertifikat berildi.',
                link: `/certificate/${certRef.id}?action=download`,
                read: false,
                createdAt: new Date()
            });
            console.log('✅ Notification created');

            alert('Sertifikat muvaffaqiyatli berildi!');
            await fetchEligibleUsers();
        } catch (error: any) {
            console.error('Error issuing certificate:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            alert(`Xatolik yuz berdi: ${error.message}`);
        } finally {
            setIssuing(null);
        }
    };

    const downloadCertificate = (eligibleUser: EligibleUser) => {
        if (!eligibleUser.certificate) return;

        // Open certificate in new window
        window.open(`/certificate/${eligibleUser.certificate.id}`, '_blank');
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Sertifikatlar</h1>
                    <p className="text-slate-400">Barcha bosqichlarni tugatgan foydalanuvchilar</p>
                </div>
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-sm text-slate-400">Jami</p>
                    <p className="text-2xl font-bold text-purple-400">{eligibleUsers.length}</p>
                </div>
            </div>

            {/* Debug Info - Remove after testing */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-400 text-sm mb-2">🔧 Debug Ma'lumotlari (Browserning Console'ini oching)</p>
                <p className="text-slate-300 text-xs">
                    Agar userlar ko'rinmasa, browser console'da loglarni tekshiring (F12 bosing)
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">#</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Ism</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Bosqichlar</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Ball</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Holat</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {eligibleUsers.map((eligible, index) => (
                                <tr key={eligible.user.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{eligible.user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{eligible.user.email}</td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {eligible.progress.completedStages.length} ta
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                            ⭐ {eligible.progress.totalCorrect}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {eligible.hasCertificate ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                Berilgan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                Kutilmoqda
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {eligible.hasCertificate ? (
                                                <button
                                                    onClick={() => downloadCertificate(eligible)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
                                                >
                                                    <Download size={16} />
                                                    Ko'rish
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => issueCertificate(eligible)}
                                                    disabled={issuing === eligible.user.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
                                                >
                                                    {issuing === eligible.user.id ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin" />
                                                            Berilmoqda...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Award size={16} />
                                                            Sertifikat berish
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {eligibleUsers.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Award size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Hozircha barcha bosqichlarni tugatgan foydalanuvchi yo'q</p>
                    </div>
                )}
            </div>
        </div>
    );
}
