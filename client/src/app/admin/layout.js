'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '@/lib/icons';

const ADMIN_NAV = [
    {
        label: 'Dashboard',
        href: '/admin',
        icon: <Icons.Dashboard className="w-5 h-5" />
    },
    {
        label: 'Questions',
        href: '/admin/questions',
        icon: <Icons.Questions className="w-5 h-5" />
    },
    {
        label: 'Rubrics',
        href: '/admin/rubrics',
        icon: <Icons.Rubrics className="w-5 h-5" />
    },
    {
        label: 'Analytics',
        href: '/admin/analytics',
        icon: <Icons.Analytics className="w-5 h-5" />
    },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[url('/grid.svg')] bg-fixed flex tracking-wide font-sans">
            {/* Sidebar with Premium Glassmorphism */}
            <aside
                className={`sticky top-0 h-screen transition-all duration-300 z-50
                    bg-black/60 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-2xl shadow-black/50
                    ${sidebarCollapsed ? 'w-20' : 'w-72'}
                `}
            >
                {/* Logo Area */}
                <div className={`h-20 flex items-center border-b border-white/5 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
                    <Link href="/admin" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300">
                                <Icons.Target className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        {!sidebarCollapsed && (
                            <div className="transition-opacity duration-300">
                                <h1 className="font-bold text-lg text-white leading-none tracking-tight">Interview<span className="text-indigo-400">AI</span></h1>
                                <p className="text-[10px] text-gray-400 font-medium tracking-widest mt-1 uppercase">Admin Console</p>
                            </div>
                        )}
                    </Link>

                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarCollapsed(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <Icons.ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Collapsed Toggle Button (when collapsed) */}
                {sidebarCollapsed && (
                    <button
                        onClick={() => setSidebarCollapsed(false)}
                        className="mx-auto mt-4 w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <Icons.ChevronRight className="w-5 h-5" />
                    </button>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {ADMIN_NAV.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                                    ${sidebarCollapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : ''}
                                `}
                            >
                                {/* Active Background Gradient */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl" />
                                )}

                                <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-indigo-400 scale-110' : 'group-hover:text-indigo-300 group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>

                                {!sidebarCollapsed && (
                                    <span className="font-medium text-sm relative z-10">{item.label}</span>
                                )}

                                {/* Active Indicator Dot */}
                                {isActive && !sidebarCollapsed && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                    <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center border border-white/10 shadow-inner group cursor-pointer hover:border-indigo-500/50 transition-colors">
                            <span className="font-bold text-xs text-indigo-300">AD</span>
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Admin User</p>
                                <Link href="/api/auth/signout" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors mt-0.5">
                                    <Icons.LogOut className="w-3 h-3" />
                                    <span>Sign out</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 relative flex flex-col h-screen overflow-hidden">
                {/* Top decorative bar */}
                <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent w-full absolute top-0 left-0 z-40" />

                {/* Header / Topbar */}
                <header className="h-20 shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-sm flex items-center justify-between px-8 z-30">
                    <div>
                        {/* Dynamic Breadcrumbs could go here */}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-colors relative">
                            <Icons.Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-black shadow-sm" />
                        </button>
                        <div className="w-px h-6 bg-white/10" />
                        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                            View App
                        </Link>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
