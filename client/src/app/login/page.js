'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowRight, Code } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.login(email, password);
            router.replace('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F9FAFB',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Inter, Helvetica Neue, system-ui, sans-serif'
        }}>
            {/* Minimal Header */}
            <header style={{
                height: '64px',
                borderBottom: '1px solid #E5E7EB',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px'
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
                        Interview<span style={{ color: '#2563EB' }}>AI</span>
                    </span>
                </Link>
            </header>

            {/* Main Content */}
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px'
            }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    {/* Card */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '20px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        overflow: 'hidden'
                    }}>
                        {/* Card Header */}
                        <div style={{ padding: '40px 40px 32px', textAlign: 'center' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: '#EFF6FF', border: '1px solid #BFDBFE',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <LogIn style={{ width: '22px', height: '22px', color: '#2563EB' }} />
                            </div>
                            <h1 style={{
                                fontSize: '22px', fontWeight: 700,
                                color: '#111827', letterSpacing: '-0.025em',
                                marginBottom: '8px'
                            }}>
                                Welcome Back
                            </h1>
                            <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                Sign in to continue your progress
                            </p>
                        </div>

                        {/* Form */}
                        <div style={{ padding: '0 40px 40px' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {error && (
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        color: '#DC2626',
                                        fontSize: '14px',
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: 600 }}>Error:</span> {error}
                                    </div>
                                )}

                                {/* Email */}
                                <div>
                                    <label style={{
                                        display: 'block', fontSize: '12px', fontWeight: 600,
                                        color: '#374151', marginBottom: '8px',
                                        textTransform: 'uppercase', letterSpacing: '0.06em'
                                    }}>
                                        Email Address
                                    </label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="clean-input"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{
                                            fontSize: '12px', fontWeight: 600,
                                            color: '#374151',
                                            textTransform: 'uppercase', letterSpacing: '0.06em'
                                        }}>
                                            Password
                                        </label>
                                        <Link href="#" style={{ fontSize: '12px', color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <input
                                        id="login-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="clean-input"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <Button
                                    id="login-submit"
                                    type="submit"
                                    disabled={loading}
                                    fullWidth
                                    size="lg"
                                    isLoading={loading}
                                    variant="primary"
                                    icon={!loading ? ArrowRight : undefined}
                                    style={{ marginTop: '8px' }}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>

                                {/* Divider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                                    <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        or
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                                </div>

                                {/* Google */}
                                <button
                                    id="login-google"
                                    type="button"
                                    onClick={() => window.location.href = 'http://localhost:3001/api/auth/google'}
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: '#FFFFFF', border: '1px solid #E5E7EB',
                                        color: '#374151', fontSize: '14px', fontWeight: 500,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '10px', cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        fontFamily: 'inherit'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </button>
                            </form>

                            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                    Don&apos;t have an account?{' '}
                                    <Link href="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                                        Create one here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
