'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    LayoutDashboard,
    LogOut,
    Zap,
    CheckCircle2,
    Target,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ============= THEME & CONSTANTS =============

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// ============= COMPONENT: DASHBOARD PAGE =============

export default function DashboardPage() {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    // Initialize & Load Data
    useEffect(() => {
        const init = async () => {
            // User Setup
            let storedUserId;
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    storedUserId = user.id;
                } catch (e) {
                    console.error('Failed to parse user', e);
                }
            }

            if (!storedUserId) {
                storedUserId = localStorage.getItem('demo-user-id');
                if (!storedUserId) {
                    storedUserId = `demo-user-${Date.now()}`;
                    localStorage.setItem('demo-user-id', storedUserId);
                }
            }
            setUserId(storedUserId);

            // Fetch All Dashboard Data
            try {
                const [summary, domains, history, trends, skills, mistakes] = await Promise.all([
                    api.getDashboardSummary(storedUserId),
                    api.getDomainBreakdown(storedUserId),
                    api.getSessionHistory(storedUserId, 5),
                    api.getTrends(storedUserId, 30),
                    api.getSkillData(storedUserId),
                    api.getMistakePatterns(storedUserId),
                ]);

                setData({ summary: summary.data, domains: domains.data, history: history.data?.sessions || [], trends: trends.data, skills: skills.data, mistakes: mistakes.data });
            } catch (err) {
                console.error('Data load failed:', err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    if (loading) return <LoadingScreen />;

    // Empty State Check
    const hasActivity = data?.summary?.sessions?.total > 0;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Navbar */}
            <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-background/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold transition-all">
                            AI
                        </div>
                        <span className="font-bold text-lg text-foreground">
                            Interview<span className="text-primary">Coach</span>
                        </span>
                    </Link>

                    <nav className="flex items-center gap-6">
                        <Link href="/interview">
                            <Button variant="ghost" size="sm">Practice Area</Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => api.logout()}
                            className="text-muted-foreground hover:text-foreground"
                            icon={LogOut}
                        >
                            Sign Out
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {Math.round(data?.summary?.overview?.overallMastery || 0)}%
                        </div>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-primary" />
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Track your progress, analyze patterns, and master your technical skills.
                        </p>
                    </div>
                    <Link href="/interview">
                        <Button variant="primary" size="lg" icon={ArrowRight}>
                            Start New Session
                        </Button>
                    </Link>
                </div>

                {!hasActivity ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                title="Overall Mastery"
                                value={`${data.summary.overview.overallMastery}%`}
                                trend={data.summary.streak > 0 ? `🔥 ${data.summary.streak} Day Streak` : 'Keep practicing!'}
                                color="text-violet-500"
                                bg="bg-violet-500/10"
                                icon={Zap}
                            />
                            <KpiCard
                                title="Questions Solved"
                                value={data.summary.overview.totalQuestions}
                                trend={`${data.summary.overview.accuracy}% Accuracy`}
                                color="text-blue-500"
                                bg="bg-blue-500/10"
                                icon={CheckCircle2}
                            />
                            <KpiCard
                                title="Topics Covered"
                                value={data.summary.overview.topicsLearned}
                                trend="Across all domains"
                                color="text-emerald-500"
                                bg="bg-emerald-500/10"
                                icon={Target}
                            />
                            <KpiCard
                                title="Active Issues"
                                value={data.mistakes.length}
                                trend={data.mistakes.length > 0 ? "Requires attention" : "All clear!"}
                                color={data.mistakes.length > 0 ? "text-rose-500" : "text-muted-foreground"}
                                bg={data.mistakes.length > 0 ? "bg-rose-500/10" : "bg-surface"}
                                icon={AlertCircle}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Chart Area */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Activity Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Performance Trend</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.trends.daily}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} tickFormatter={d => new Date(d).getDate()} />
                                                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 10]} tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                                                        itemStyle={{ color: '#8b5cf6' }}
                                                    />
                                                    <Area type="monotone" dataKey="avgScore" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Sessions List */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Sessions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                                                        <th className="py-3 pl-6 font-medium">Date</th>
                                                        <th className="py-3 font-medium">Topic</th>
                                                        <th className="py-3 font-medium">Score</th>
                                                        <th className="py-3 font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {data.history.map((session, i) => (
                                                        <tr key={i} className="group hover:bg-surface/50 transition-colors border-b border-border last:border-0">
                                                            <td className="py-4 pl-6 text-muted-foreground font-mono">
                                                                {new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </td>
                                                            <td className="py-4 font-medium text-foreground">
                                                                {session.domain} <span className="text-muted-foreground mx-1">•</span> {session.difficulty}
                                                            </td>
                                                            <td className="py-4">
                                                                <Badge variant={
                                                                    session.avgScore >= 8 ? 'success' :
                                                                        session.avgScore >= 6 ? 'warning' : 'danger'
                                                                }>
                                                                    {(session.avgScore || 0).toFixed(1)}/10
                                                                </Badge>
                                                            </td>
                                                            <td className="py-4">
                                                                <Badge variant={session.status === 'completed' ? 'primary' : 'neutral'}>
                                                                    {session.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar Stats */}
                            <div className="space-y-6">
                                {/* Skill Radar */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skill Profile</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px] w-full relative">
                                            {data.skills.radar.length > 2 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skills.radar}>
                                                        <PolarGrid stroke="hsl(var(--border))" />
                                                        <PolarAngleAxis dataKey="topic" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar name="Mastery" dataKey="mastery" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm text-center px-6">
                                                    Complete more sessions covering different topics to build your radar.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Mistake Patterns */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Focus Areas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {data.mistakes.length > 0 ? (
                                            <div className="space-y-3">
                                                {data.mistakes.slice(0, 3).map((mistake, i) => (
                                                    <div key={i} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle className="w-4 h-4 text-rose-500 mt-1 shrink-0" />
                                                            <div>
                                                                <h4 className="text-sm font-medium text-foreground">{mistake.description}</h4>
                                                                <p className="text-xs text-rose-500/80 mt-1">Occurred {mistake.frequency} times</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-muted-foreground text-sm">
                                                No recurring mistakes found. Excellent work!
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Domain Distribution */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Domain Focus</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data.domains}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="totalQuestions"
                                                    >
                                                        {data.domains.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            {data.domains.slice(0, 4).map((d, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="truncate max-w-[100px]">{d.domain}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

// ============= SUB-COMPONENTS =============

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground mt-4 animate-pulse">Loading Dashboard...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center mb-6 shadow-xl">
                <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Begin Your Journey</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                Your analytics will appear here after your first interview session. Start practicing to unlock insights.
            </p>
            <Link href="/interview">
                <Button variant="primary" size="xl">
                    Start First Interview
                </Button>
            </Link>
        </div>
    );
}

function KpiCard({ title, value, trend, color, bg, icon: Icon }) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between p-6">
                <div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-foreground">{value}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium mt-1 block">{trend}</span>
                </div>
                <div className={`p-3 rounded-xl ${bg} ${color} border border-border/50`}>
                    <Icon className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
    );
}
