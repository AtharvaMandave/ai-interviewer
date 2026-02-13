'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DOMAINS, DIFFICULTIES } from '@/lib/constants';
import {
    Search,
    Plus,
    Trash2,
    Database,
    Code,
    Cpu,
    Settings,
    Users,
    Terminal,
    HelpCircle,
    Filter,
    X,
    Edit,
    Trash
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Map domains to icons
const DOMAIN_ICON_MAP = {
    DSA: Code,
    Java: Cpu,
    DBMS: Database,
    OS: Settings,
    HR: Users,
    React: Code,
    C: Terminal,
    CPP: Terminal,
    Python: Code,
    default: HelpCircle
};

export default function QuestionsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Filters
    const [domain, setDomain] = useState(searchParams.get('domain') || '');
    const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadQuestions();
    }, [domain, difficulty]);

    async function loadQuestions() {
        try {
            setLoading(true);
            const params = {};
            if (domain) params.domain = domain;
            if (difficulty) params.difficulty = difficulty;

            const response = await api.getQuestions(params);
            setQuestions(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        try {
            await api.deleteQuestion(id);
            setQuestions(questions.filter(q => q.id !== id));
            setDeleteId(null);
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    }

    const filteredQuestions = questions.filter(q =>
        !search || q.text.toLowerCase().includes(search.toLowerCase()) ||
        q.topic.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Questions Bank</h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        {filteredQuestions.length} questions found
                    </p>
                </div>
                <Link href="/admin/questions/new">
                    <Button variant="primary" icon={Plus}>
                        Add Question
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search questions by text or topic..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="clean-input pl-9"
                            />
                        </div>

                        {/* Domain Filter */}
                        <div className="relative w-full md:w-48">
                            <select
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className="clean-input appearance-none cursor-pointer"
                            >
                                <option value="">All Domains</option>
                                {DOMAINS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Difficulty Filter */}
                        <div className="relative w-full md:w-40">
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="clean-input appearance-none cursor-pointer"
                            >
                                <option value="">All Difficulties</option>
                                {DIFFICULTIES.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Clear Filters */}
                        {(domain || difficulty || search) && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDomain('');
                                    setDifficulty('');
                                    setSearch('');
                                }}
                                icon={X}
                                title="Clear Filters"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
                    <p>Error: {error}</p>
                    <Button variant="ghost" size="sm" onClick={loadQuestions} className="text-destructive hover:text-destructive/80">Retry</Button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />
                    ))}
                </div>
            )}

            {/* Questions List */}
            {!loading && (
                <div className="space-y-4">
                    {filteredQuestions.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/25">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No questions found</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                We couldn't find any questions matching your filters. Try adjusting your search or add a new question.
                            </p>
                            <Link href="/admin/questions/new">
                                <Button variant="link">Create your first question</Button>
                            </Link>
                        </div>
                    ) : (
                        filteredQuestions.map((question) => {
                            const DomainIcon = DOMAIN_ICON_MAP[question.domain] || DOMAIN_ICON_MAP.default;

                            return (
                                <Card key={question.id} hover className="group transition-all">
                                    <CardContent className="p-5 flex items-start gap-5">
                                        {/* Domain Icon */}
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                                            <DomainIcon className="w-6 h-6" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 pr-20">
                                                    {question.text}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                                                <Badge variant={
                                                    question.difficulty === 'Easy' ? 'success' :
                                                        question.difficulty === 'Medium' ? 'warning' : 'danger'
                                                }>
                                                    {question.difficulty}
                                                </Badge>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                                    {question.topic}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                                    {question.domain}
                                                </span>
                                            </div>

                                            {question.tags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {question.tags.slice(0, 5).map(tag => (
                                                        <Badge key={tag} variant="outline" size="xs" className="font-normal">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/admin/questions/${question.id}`}>
                                                <Button variant="ghost" size="icon" icon={Edit} />
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                icon={Trash2}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteId(question.id);
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteId(null)}>
                    <Card className="max-w-md w-full m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 mx-auto">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Delete Question?</h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                Are you sure you want to delete this question? This will permanently remove it from the database and cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>
                                    Cancel
                                </Button>
                                <Button variant="danger" fullWidth onClick={() => handleDelete(deleteId)}>
                                    Yes, Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
