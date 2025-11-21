'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Certificate } from '@/lib/schema';
import { Award, Download, Loader2 } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

export default function CertificatePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const certificateId = params.certificateId as string;

    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCertificate();
    }, [certificateId]);

    useEffect(() => {
        // Auto-print if action=download is present
        if (certificate && !loading && searchParams.get('action') === 'download') {
            // Small delay to ensure rendering is complete
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [certificate, loading, searchParams]);

    const fetchCertificate = async () => {
        try {
            const certDoc = await getDoc(doc(db, 'certificates', certificateId));
            if (certDoc.exists()) {
                setCertificate(certDoc.data() as Certificate);
            }
        } catch (error) {
            console.error('Error fetching certificate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <Loader2 size={48} className="animate-spin text-purple-500" />
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="text-center">
                    <Award size={64} className="mx-auto mb-4 text-slate-600" />
                    <h1 className="text-2xl font-bold text-white mb-2">Sertifikat topilmadi</h1>
                    <p className="text-slate-400">Ushbu sertifikat mavjud emas</p>
                </div>
            </div>
        );
    }

    const issuedDate = certificate.issuedAt instanceof Date
        ? certificate.issuedAt
        : (certificate.issuedAt as any).toDate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-8">
            {/* Print Button - Hidden when printing */}
            <div className="max-w-4xl mx-auto mb-6 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 transition-all shadow-lg"
                >
                    <Download size={20} />
                    Yuklab olish / Chop etish
                </button>
            </div>

            {/* Certificate */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none">
                {/* Decorative Header */}
                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-32 translate-y-32"></div>
                    </div>
                    <div className="relative">
                        <Award size={64} className="mx-auto mb-4 text-white" />
                        <h1 className="text-4xl font-bold text-white mb-2">SERTIFIKAT</h1>
                        <p className="text-purple-100 text-lg">Muvaffaqiyatli yakunlash sertifikati</p>
                    </div>
                </div>

                {/* Certificate Body */}
                <div className="p-12 text-center">
                    <p className="text-slate-600 text-lg mb-8">Ushbu sertifikat quyidagi shaxsga beriladi:</p>

                    <h2 className="text-5xl font-bold text-slate-900 mb-12 border-b-4 border-purple-600 inline-block pb-2 px-8">
                        {certificate.userName}
                    </h2>

                    <p className="text-slate-700 text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
                        Buxgalteriya kursining barcha <span className="font-bold text-purple-600">{certificate.totalStages}</span> bosqichini
                        muvaffaqiyatli yakunlagani va <span className="font-bold text-green-600">{certificate.totalScore}</span> ball
                        to'plagani uchun ushbu sertifikat beriladi.
                    </p>

                    {/* Certificate Details */}
                    <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mt-12 mb-12">
                        <div className="text-left">
                            <p className="text-sm text-slate-500 mb-1">Sertifikat raqami:</p>
                            <p className="font-mono font-bold text-slate-900">{certificate.certificateNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500 mb-1">Berilgan sana:</p>
                            <p className="font-bold text-slate-900">
                                {issuedDate.toLocaleDateString('uz-UZ', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="flex justify-around items-end mt-16 pt-8 border-t-2 border-slate-200">
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                            <p className="text-sm text-slate-600">Direktor imzosi</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                <Award size={48} className="text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                            <p className="text-sm text-slate-600">Muhr</p>
                        </div>
                    </div>
                </div>

                {/* Decorative Footer */}
                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 p-4">
                    <p className="text-center text-white text-sm">
                        Buxgalteriya Ta'lim Markazi | www.bugalteriya.uz
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
