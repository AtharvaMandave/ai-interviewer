'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAuth = async () => {
            if (!token) {
                setError('No authentication token found.');
                setTimeout(() => router.replace('/login'), 2000);
                return;
            }

            try {
                // Store token immediately to allow API calls to work
                localStorage.setItem('token', token);

                // Fetch user details to confirm validity and store user data
                const response = await api.getMe();

                if (response.data) {
                    localStorage.setItem('user', JSON.stringify(response.data));
                    router.replace('/dashboard');
                } else {
                    throw new Error('Failed to fetch user profile');
                }
            } catch (err) {
                console.error('Auth Callback Error:', err);
                setError('Authentication failed. Please try again.');
                localStorage.removeItem('token'); // Clear invalid token
                setTimeout(() => router.replace('/login'), 3000);
            }
        };

        handleAuth();
    }, [token, router]);

    if (error) {
        return (
            <div className="text-center animate-fade-in">
                <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-foreground">Authentication Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">Completing Sign In...</h1>
            <p className="text-muted-foreground">Please wait while we redirect you to your dashboard.</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <Suspense fallback={
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading authentication...</p>
                </div>
            }>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
