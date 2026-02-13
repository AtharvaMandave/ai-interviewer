'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { DOMAIN_COLORS, DIFFICULTY_COLORS } from '@/lib/constants';
import { Icons } from '@/lib/icons';

export default function RubricsPage() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    useEffect(() => {
        loadQuestions();
    }, []);

    async function loadQuestions() {
        try {
            setLoading(true);
            const response = await api.getQuestions({ limit: 100 });
            setQuestions(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Questions with rubrics
    const withRubric = questions.filter(q => q.rubric);
    const withoutRubric = questions.filter(q => !q.rubric);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-white/5 pb-6">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    Rubric Management
                </h1>
                <p className="text-gray-400 mt-2 flex items-center gap-2 text-lg font-light">
                    <Icons.Rubrics className="w-5 h-5 text-purple-400" />
                    Manage scoring criteria and evaluation logic
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/5">
                            <Icons.Database className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Questions</p>
                            <p className="text-3xl font-bold text-white">{questions.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <Icons.Check className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-purple-400/70 text-sm font-medium uppercase tracking-wider">With Rubrics</p>
                            <p className="text-3xl font-bold text-white">{withRubric.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                            <Icons.Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-orange-400/70 text-sm font-medium uppercase tracking-wider">Missing Rubrics</p>
                            <p className="text-3xl font-bold text-white">{withoutRubric.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            )}

            {/* Questions Missing Rubrics */}
            {!loading && withoutRubric.length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Icons.Bell className="w-5 h-5 text-orange-400" />
                        Action Required: Missing Rubrics
                    </h2>
                    <div className="space-y-3">
                        {withoutRubric.slice(0, 5).map(q => (
                            <div key={q.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${DOMAIN_COLORS[q.domain]}`}>
                                        {q.domain}
                                    </span>
                                    <span className="text-gray-300 font-medium line-clamp-1 max-w-md">
                                        {q.text}
                                    </span>
                                </div>
                                <Link href={`/admin/questions/${q.id}`} className="btn btn-primary text-xs py-2 px-3">
                                    <Icons.Plus className="w-3 h-3 mr-1" />
                                    Create Rubric
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Questions with Rubrics */}
            {!loading && (
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Icons.Rubrics className="w-5 h-5 text-indigo-400" />
                            Rubric Library
                        </h2>
                        <span className="text-sm text-gray-500">{withRubric.length} Evaluation Criteria Active</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Question</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Must Have</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Good to Have</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Red Flags</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {withRubric.map(q => (
                                    <tr key={q.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${DOMAIN_COLORS[q.domain]}`}>
                                                {q.domain}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="line-clamp-1 text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{q.text}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {q.rubric?.mustHave?.length || 0}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                {q.rubric?.goodToHave?.length || 0}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                {q.rubric?.redFlags?.length || 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedQuestion(q)}
                                                className="text-indigo-400 hover:text-white text-sm font-medium transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Rubric Detail Modal */}
            {selectedQuestion && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedQuestion(null)}>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex items-start justify-between sticky top-0 bg-[#0a0a0a] z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${DOMAIN_COLORS[selectedQuestion.domain]}`}>
                                        {selectedQuestion.domain}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${DIFFICULTY_COLORS[selectedQuestion.difficulty]}`}>
                                        {selectedQuestion.difficulty}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white leading-tight">
                                    {selectedQuestion.text}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedQuestion(null)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <Icons.Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="p-8">
                            {selectedQuestion.rubric && (
                                <div className="space-y-8">
                                    {/* Must Have */}
                                    <div className="bg-indigo-500/5 rounded-xl p-5 border border-indigo-500/10">
                                        <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Icons.Check className="w-4 h-4" />
                                            Must Have Points
                                        </h4>
                                        <ul className="space-y-3">
                                            {(selectedQuestion.rubric.mustHave || []).map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                    <span className="leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Good to Have */}
                                        <div className="bg-purple-500/5 rounded-xl p-5 border border-purple-500/10">
                                            <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Icons.Plus className="w-4 h-4" />
                                                Bonus Points
                                            </h4>
                                            <ul className="space-y-3">
                                                {(selectedQuestion.rubric.goodToHave || []).map((item, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                                        <span className="leading-relaxed">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Red Flags */}
                                        <div className="bg-red-500/5 rounded-xl p-5 border border-red-500/10">
                                            <h4 className="text-sm font-bold text-red-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Icons.Trash className="w-4 h-4" />
                                                Red Flags
                                            </h4>
                                            <ul className="space-y-3">
                                                {(selectedQuestion.rubric.redFlags || []).map((item, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                        <span className="leading-relaxed">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 pt-8 border-t border-white/5 flex justify-end gap-4">
                                <button
                                    onClick={() => setSelectedQuestion(null)}
                                    className="btn btn-secondary px-6"
                                >
                                    Close
                                </button>
                                <Link
                                    href={`/admin/questions/${selectedQuestion.id}`}
                                    className="btn btn-primary px-6"
                                >
                                    Edit Rubric
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
