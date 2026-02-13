'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Database,
    Check,
    Users,
    Target,
    TvMinimalPlay,
    Plus,
    Search,
    Bell,
    Settings,
    Activity,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Helper for nice gradients
const DOMAIN_STYLES = {
    DSA: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
    Java: 'from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30',
    DBMS: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    OS: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    HR: 'from-yellow-400/20 to-orange-500/20 text-yellow-400 border-yellow-500/30',
    React: 'from-sky-400/20 to-blue-600/20 text-sky-400 border-sky-500/30',
    C: 'from-indigo-500/20 to-blue-600/20 text-indigo-400 border-indigo-500/30',
    CPP: 'from-blue-600/20 to-indigo-700/20 text-indigo-400 border-indigo-500/30',
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            const response = await api.getQuestionStats();
            setStats(response.data || {});
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data');
            setStats({
                DSA: 15, Java: 12, DBMS: 8, OS: 5, HR: 3, React: 10
            });
        } finally {
            setLoading(false);
        }
    }

    const totalQuestions = Object.values(stats || {}).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header with quick add */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Admin Dashboard
                        <Badge variant="primary">Overview</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage questions, rubrics, and monitor ecosystem performance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" icon={Search}>
                        <span className="hidden md:inline">Search</span>
                    </Button>
                    <Link href="/admin/questions/new">
                        <Button variant="primary" icon={Plus}>
                            Add Question
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Questions Metric */}
                <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-700">
                        <Database className="w-32 h-32" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Total Questions
                        </CardTitle>
                        <Badge variant="success" size="xs">
                            <Check className="w-3 h-3 mr-1" /> +12%
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-foreground tabular-nums">
                            {loading ? <span className="animate-pulse">...</span> : totalQuestions}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all domains
                        </p>
                    </CardContent>
                </Card>

                {/* Rubric Health Metric */}
                <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-700">
                        <FileText className="w-32 h-32" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className=" text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Rubric Coverage
                        </CardTitle>
                        <Badge variant="accent" size="xs">High Quality</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-foreground tabular-nums">
                            85%
                        </div>
                        <div className="w-full bg-secondary h-1.5 mt-3 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full w-[85%]" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Questions with detailed rubrics
                        </p>
                    </CardContent>
                </Card>

                {/* Active Users Metric */}
                <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-700">
                        <Users className="w-32 h-32" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Active Sessions
                        </CardTitle>
                        <span className="flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-foreground tabular-nums">
                            24
                        </div>
                        <div className="flex -space-x-2 mt-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-300">
                                    U{i}
                                </div>
                            ))}
                            <div className="w-7 h-7 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center text-[10px] text-muted-foreground">
                                +20
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Currently practicing
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Domain Distribution Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Domain Distribution
                    </h2>
                    <Button variant="ghost" size="sm" className="text-xs">
                        View All Domains →
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 rounded-xl bg-secondary animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(stats || {}).map(([domain, count]) => {
                            const style = DOMAIN_STYLES[domain] || 'from-zinc-800/50 to-zinc-900/50 text-zinc-400 border-zinc-800';

                            return (
                                <Link
                                    key={domain}
                                    href={`/admin/questions?domain=${domain}`}
                                    className={`group relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 border bg-gradient-to-br ${style} hover:shadow-lg`}
                                >
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg text-foreground mb-1">
                                                {domain}
                                            </h3>
                                            <Badge variant="neutral" size="xs" className="bg-black/20 border-transparent text-current opacity-80">
                                                {count} Questions
                                            </Badge>
                                        </div>
                                        <div className="p-2 rounded-lg bg-black/10 group-hover:bg-black/20 transition-colors">
                                            <TvMinimalPlay className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-muted-foreground" />
                            System Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {[
                            { action: 'New question added', target: 'Binary Tree Traversal', user: 'Admin', time: '2m', icon: <Plus className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-500/10' },
                            { action: 'Rubric updated', target: 'System Design: Instagram', user: 'Admin', time: '1h', icon: <FileText className="w-4 h-4 text-purple-400" />, color: 'bg-purple-500/10' },
                            { action: 'Session Completed', target: 'User #8821 (DSA)', user: 'System', time: '3h', icon: <Check className="w-4 h-4 text-blue-400" />, color: 'bg-blue-500/10' },
                            { action: 'High fail rate detected', target: 'Dynamic Programming', user: 'System', time: '5h', icon: <Bell className="w-4 h-4 text-amber-400" />, color: 'bg-amber-500/10' },
                        ].map((activity, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors border-b border-border last:border-0 last:pb-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activity.color}`}>
                                    {activity.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {activity.action}
                                    </p>
                                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                        <span className="text-primary font-medium mr-1">{activity.target}</span> • <span className="ml-1">{activity.user}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">{activity.time}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Quick Actions Panel */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common admin tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/admin/questions/new">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer group">
                                <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center group-hover:text-primary transition-colors text-muted-foreground">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">New Question</h3>
                                    <p className="text-xs text-muted-foreground">Add to question bank</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/admin/rubrics">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer group">
                                <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center group-hover:text-purple-500 transition-colors text-muted-foreground">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">Manage Rubrics</h3>
                                    <p className="text-xs text-muted-foreground">Edit scoring criteria</p>
                                </div>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer group">
                            <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center group-hover:text-zinc-500 transition-colors text-muted-foreground">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Settings</h3>
                                <p className="text-xs text-muted-foreground">Configure system</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

