'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

import AdminBackground from '@/components/admin/AdminBackground';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoadingAuth } = useStore();
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (isLoadingAuth) return;

        // Allow access to admin login page
        if (pathname === '/admin/auth') {
            setAuthorized(true);
            return;
        }

        if (!user) {
            router.push('/admin/auth');
            return;
        }

        if (user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        setAuthorized(true);
    }, [user, isLoadingAuth, router, pathname]);

    if (isLoadingAuth || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
                Ruxsatlar tekshirilmoqda...
            </div>
        );
    }

    // If on auth page, don't show sidebar
    if (pathname === '/admin/auth') {
        return <>{children}</>;
    }

    return (
        <div className={`min-h-screen text-slate-100 transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
            <AdminBackground />
            <AdminSidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <main className="p-8">
                {children}
            </main>
        </div>
    );
}
