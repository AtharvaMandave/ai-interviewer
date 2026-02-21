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
    ArrowRight,
    Code
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// ============= THEME & CONSTANTS =============

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];

// ============= COMPONENT: DASHBOARD PAGE =============

export default function DashboardPage() {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const init = async () => {
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

            try {
                const [summary, domains, history, trends, skills, mistakes] = await Promise.all([
                    api.getDashboardSummary(storedUserId),
                    api.getDomainBreakdown(storedUserId),
                    api.getSessionHistory(storedUserId, 5),
                    api.getTrends(storedUserId, 30),
                    api.getSkillData(storedUserId),
                    api.getMistakePatterns(storedUserId),
                ]);

                setData({
                    summary: summary.data,
                    domains: domains.data,
                    history: history.data?.sessions || [],
                    trends: trends.data,
                    skills: skills.data,
                    mistakes: mistakes.data
                });
            } catch (err) {
                console.error('Data load failed:', err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    if (loading) return <LoadingScreen />;

    const hasActivity = data?.summary?.sessions?.total > 0;

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F9FAFB',
            color: '#111827',
            fontFamily: 'Inter, Helvetica Neue, system-ui, sans-serif'
        }}>
            {/* Navbar */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                height: '64px',
                borderBottom: '1px solid #E5E7EB',
                background: 'rgba(249,250,251,0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
            }}>
                <div style={{
                    maxWidth: '1200px', margin: '0 auto',
                    padding: '0 24px', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#2563EB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Code style={{ width: '16px', height: '16px', color: '#fff' }} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                            Interview<span style={{ color: '#2563EB' }}>Coach</span>
                        </span>
                    </Link>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link href="/interview">
                            <Button variant="ghost" size="sm">Practice Area</Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => api.logout()}
                            icon={LogOut}
                            style={{ color: '#9CA3AF' }}
                        >
                            Sign Out
                        </Button>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: '#EFF6FF', border: '1px solid #BFDBFE',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, color: '#2563EB'
                        }}>
                            {Math.round(data?.summary?.overview?.overallMastery || 0)}%
                        </div>
                    </nav>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
                {/* Page Header */}
                <div style={{
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                    gap: '24px', paddingBottom: '32px',
                    borderBottom: '1px solid #E5E7EB',
                    marginBottom: '32px'
                }} className="flex-col md:flex-row">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{
                                padding: '8px', borderRadius: '10px',
                                background: '#EFF6FF'
                            }}>
                                <LayoutDashboard style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                            </div>
                            <h1 style={{
                                fontSize: '26px', fontWeight: 700,
                                color: '#111827', letterSpacing: '-0.025em'
                            }}>
                                Dashboard
                            </h1>
                        </div>
                        <p style={{ fontSize: '14px', color: '#6B7280' }}>
                            Track your progress, analyze patterns, and master your technical skills.
                        </p>
                    </div>
                    <Link href="/interview">
                        <Button variant="primary" size="md" icon={ArrowRight}>
                            Start New Session
                        </Button>
                    </Link>
                </div>

                {!hasActivity ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* KPI Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '16px',
                            marginBottom: '24px'
                        }} className="grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                title="Overall Mastery"
                                value={`${data.summary.overview.overallMastery}%`}
                                trend={data.summary.streak > 0 ? `🔥 ${data.summary.streak} Day Streak` : 'Keep practicing!'}
                                accentColor='#7C3AED'
                                accentBg='#F5F3FF'
                                icon={Zap}
                            />
                            <KpiCard
                                title="Questions Solved"
                                value={data.summary.overview.totalQuestions}
                                trend={`${data.summary.overview.accuracy}% Accuracy`}
                                accentColor='#2563EB'
                                accentBg='#EFF6FF'
                                icon={CheckCircle2}
                            />
                            <KpiCard
                                title="Topics Covered"
                                value={data.summary.overview.topicsLearned}
                                trend="Across all domains"
                                accentColor='#059669'
                                accentBg='#ECFDF5'
                                icon={Target}
                            />
                            <KpiCard
                                title="Active Issues"
                                value={data.mistakes.length}
                                trend={data.mistakes.length > 0 ? "Requires attention" : "All clear!"}
                                accentColor={data.mistakes.length > 0 ? '#DC2626' : '#9CA3AF'}
                                accentBg={data.mistakes.length > 0 ? '#FEF2F2' : '#F3F4F6'}
                                icon={AlertCircle}
                            />
                        </div>

                        {/* Main Grid — 2/3 + 1/3 */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 340px',
                            gap: '24px',
                            alignItems: 'start'
                        }} className="grid-cols-1 lg:grid-cols-[1fr_340px]">
                            {/* Left: Charts */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Performance Trend */}
                                <div style={{
                                    background: '#FFFFFF',
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '20px 24px 0' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            Performance Trend
                                        </p>
                                    </div>
                                    <div style={{ padding: '16px 24px 24px', height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.trends.daily}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                                <XAxis dataKey="date" stroke="#D1D5DB" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={d => new Date(d).getDate()} />
                                                <YAxis stroke="#D1D5DB" domain={[0, 10]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#111827', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                                                    itemStyle={{ color: '#2563EB' }}
                                                />
                                                <Area type="monotone" dataKey="avgScore" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Recent Sessions */}
                                <div style={{
                                    background: '#FFFFFF',
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '20px 24px 0' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            Recent Sessions
                                        </p>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                                                    {['Date', 'Topic', 'Score', 'Status'].map(h => (
                                                        <th key={h} style={{
                                                            padding: '12px 24px',
                                                            textAlign: 'left',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            color: '#9CA3AF',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.06em'
                                                        }}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.history.map((session, i) => (
                                                    <tr
                                                        key={i}
                                                        style={{
                                                            borderBottom: i === data.history.length - 1 ? 'none' : '1px solid #F3F4F6',
                                                            transition: 'background 0.1s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <td style={{ padding: '14px 24px', fontSize: '13px', color: '#6B7280', fontFamily: 'monospace' }}>
                                                            {new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                                                            {session.domain} <span style={{ color: '#D1D5DB', margin: '0 4px' }}>•</span> {session.difficulty}
                                                        </td>
                                                        <td style={{ padding: '14px 24px' }}>
                                                            <Badge variant={
                                                                session.avgScore >= 8 ? 'success' :
                                                                    session.avgScore >= 6 ? 'warning' : 'danger'
                                                            }>
                                                                {(session.avgScore || 0).toFixed(1)}/10
                                                            </Badge>
                                                        </td>
                                                        <td style={{ padding: '14px 24px' }}>
                                                            <Badge variant={session.status === 'completed' ? 'primary' : 'neutral'}>
                                                                {session.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Skill Radar */}
                                <div style={{
                                    background: '#FFFFFF',
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    padding: '24px'
                                }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                                        Skill Profile
                                    </p>
                                    <div style={{ height: '240px', position: 'relative' }}>
                                        {data.skills.radar.length > 2 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skills.radar}>
                                                    <PolarGrid stroke="#E5E7EB" />
                                                    <PolarAngleAxis dataKey="topic" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar name="Mastery" dataKey="mastery" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '10px' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                textAlign: 'center'
                                            }}>
                                                <p style={{ fontSize: '13px', color: '#9CA3AF', padding: '0 16px' }}>
                                                    Complete more sessions to build your radar.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Focus Areas (Mistakes) */}
                                <div style={{
                                    background: '#FFFFFF',
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    padding: '24px'
                                }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                                        Focus Areas
                                    </p>
                                    {data.mistakes.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {data.mistakes.slice(0, 3).map((mistake, i) => (
                                                <div key={i} style={{
                                                    padding: '14px 16px',
                                                    borderRadius: '12px',
                                                    background: '#FEF2F2',
                                                    border: '1px solid #FECACA'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                        <AlertCircle style={{ width: '16px', height: '16px', color: '#DC2626', marginTop: '2px', flexShrink: 0 }} />
                                                        <div>
                                                            <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                                                                {mistake.description}
                                                            </p>
                                                            <p style={{ fontSize: '12px', color: '#EF4444' }}>
                                                                Occurred {mistake.frequency} times
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                                            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
                                                No recurring mistakes found. Excellent work!
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Domain Distribution */}
                                <div style={{
                                    background: '#FFFFFF',
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    padding: '24px'
                                }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                                        Domain Focus
                                    </p>
                                    <div style={{ height: '180px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.domains}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={4}
                                                    dataKey="totalQuestions"
                                                    strokeWidth={0}
                                                >
                                                    {data.domains.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '10px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                                        {data.domains.slice(0, 4).map((d, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                                <span style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {d.domain}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
        <div style={{
            minHeight: '100vh', background: '#F9FAFB',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '16px',
            fontFamily: 'Inter, Helvetica Neue, system-ui, sans-serif'
        }}>
            <div style={{
                width: '40px', height: '40px',
                border: '3px solid #E5E7EB',
                borderTopColor: '#2563EB',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Loading Dashboard...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', textAlign: 'center'
        }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '20px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '24px', fontSize: '36px'
            }}>
                🚀
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                Begin Your Journey
            </h2>
            <p style={{ fontSize: '15px', color: '#6B7280', maxWidth: '420px', lineHeight: 1.65, marginBottom: '32px' }}>
                Your analytics will appear here after your first interview session. Start practicing to unlock insights.
            </p>
            <Link href="/interview">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                    Start First Interview
                </Button>
            </Link>
        </div>
    );
}

function KpiCard({ title, value, trend, accentColor, accentBg, icon: Icon }) {
    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            padding: '24px'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        {title}
                    </p>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                        {value}
                    </div>
                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>{trend}</span>
                </div>
                <div style={{
                    padding: '10px', borderRadius: '12px',
                    background: accentBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon style={{ width: '20px', height: '20px', color: accentColor }} />
                </div>
            </div>
        </div>
    );
}
