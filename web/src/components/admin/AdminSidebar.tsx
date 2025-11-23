'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, FileText, BarChart3, Trophy, LogOut, Award, Zap } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Tests', href: '/admin/tests', icon: FileText },
    { name: 'Quick Tests', href: '/admin/quick-tests', icon: Zap },
    { name: 'Certificates', href: '/admin/certificates', icon: Award },
    { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

interface AdminSidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

export default function AdminSidebar({ isCollapsed, toggleSidebar }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/auth/login');
    };

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 min-h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 z-50`}>
            <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
                        A
                    </div>
                    {!isCollapsed && (
                        <span className="font-bold text-white tracking-tight whitespace-nowrap">Admin Panel</span>
                    )}
                </div>
                {!isCollapsed && (
                    <button onClick={toggleSidebar} className="text-slate-400 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                )}
            </div>

            {isCollapsed && (
                <div className="flex justify-center py-2 border-b border-slate-800">
                    <button onClick={toggleSidebar} className="text-slate-400 hover:text-white p-2">
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : ''}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                ? 'bg-cyan-500/10 text-cyan-400'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    title={isCollapsed ? 'Logout' : ''}
                    className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
