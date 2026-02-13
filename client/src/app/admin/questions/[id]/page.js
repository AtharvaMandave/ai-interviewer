'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { DOMAINS, DIFFICULTIES } from '@/lib/constants';
import { Icons } from '@/lib/icons';

export default function EditQuestionPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        domain: '',
        topic: '',
        subTopic: '',
        difficulty: '',
        text: '',
        tags: '',
        hints: '',
        companyTags: '',
    });

    const [rubric, setRubric] = useState({
        mustHave: '',
        goodToHave: '',
        redFlags: '',
    });

    useEffect(() => {
        loadQuestion();
    }, [id]);

    async function loadQuestion() {
        try {
            setLoading(true);
            const response = await api.getQuestion(id);
            const q = response.data;

            setFormData({
                domain: q.domain || '',
                topic: q.topic || '',
                subTopic: q.subTopic || '',
                difficulty: q.difficulty || '',
                text: q.text || '',
                tags: (q.tags || []).join(', '),
                hints: (q.hints || []).join(', '),
                companyTags: (q.companyTags || []).join(', '),
            });

            if (q.rubric) {
                setRubric({
                    mustHave: (q.rubric.mustHave || []).join('\n'),
                    goodToHave: (q.rubric.goodToHave || []).join('\n'),
                    redFlags: (q.rubric.redFlags || []).join('\n'),
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleRubricChange(e) {
        setRubric({ ...rubric, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const questionData = {
                ...formData,
                tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
                hints: formData.hints.split(',').map(s => s.trim()).filter(Boolean),
                companyTags: formData.companyTags.split(',').map(s => s.trim()).filter(Boolean),
            };

            await api.updateQuestion(id, questionData);

            // Update rubric separately
            const rubricData = {
                mustHave: rubric.mustHave.split('\n').map(s => s.trim()).filter(Boolean),
                goodToHave: rubric.goodToHave.split('\n').map(s => s.trim()).filter(Boolean),
                redFlags: rubric.redFlags.split('\n').map(s => s.trim()).filter(Boolean),
            };

            await api.upsertRubric(id, rubricData);

            router.push('/admin/questions');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="card animate-pulse bg-white/5 border-white/5">
                    <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-white/5 rounded w-full mb-2"></div>
                    <div className="h-4 bg-white/5 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <Link
                    href="/admin/questions"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
                >
                    <Icons.ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Edit Question</h1>
                    <p className="text-gray-400 text-sm mt-1">Update question details and evaluation criteria</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                    <Icons.Trash className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info Card */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Icons.Edit className="w-5 h-5 text-indigo-400" />
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Domain *</label>
                            <select
                                name="domain"
                                value={formData.domain}
                                onChange={handleChange}
                                className="select bg-white/5 border-white/10 focus:border-indigo-500 w-full"
                                required
                            >
                                {DOMAINS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Difficulty *</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="select bg-white/5 border-white/10 focus:border-indigo-500 w-full"
                                required
                            >
                                {DIFFICULTIES.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Topic *</label>
                            <input
                                type="text"
                                name="topic"
                                value={formData.topic}
                                onChange={handleChange}
                                className="input bg-white/5 border-white/10 focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sub Topic</label>
                            <input
                                type="text"
                                name="subTopic"
                                value={formData.subTopic}
                                onChange={handleChange}
                                className="input bg-white/5 border-white/10 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Question Text *</label>
                        <textarea
                            name="text"
                            value={formData.text}
                            onChange={handleChange}
                            className="textarea h-40 bg-white/5 border-white/10 focus:border-indigo-500 font-mono text-sm leading-relaxed"
                            required
                        />
                    </div>
                </div>

                {/* Tags Card */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Icons.Target className="w-5 h-5 text-cyan-400" />
                        Metadata
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Tags (comma separated)</label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                className="input bg-white/5 border-white/10 focus:border-indigo-500"
                                placeholder="e.g. array, pointers, optimization"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Hints</label>
                            <input
                                type="text"
                                name="hints"
                                value={formData.hints}
                                onChange={handleChange}
                                className="input bg-white/5 border-white/10 focus:border-indigo-500"
                                placeholder="e.g. Think about using a hash map..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Company Tags</label>
                            <input
                                type="text"
                                name="companyTags"
                                value={formData.companyTags}
                                onChange={handleChange}
                                className="input bg-white/5 border-white/10 focus:border-indigo-500"
                                placeholder="e.g. Google, Amazon, Microsoft"
                            />
                        </div>
                    </div>
                </div>

                {/* Rubric Card */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Icons.Rubrics className="w-5 h-5 text-purple-400" />
                        Scoring Rubric
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-indigo-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                <Icons.Check className="w-4 h-4" />
                                Must Have Points (One per line)
                            </label>
                            <textarea
                                name="mustHave"
                                value={rubric.mustHave}
                                onChange={handleRubricChange}
                                className="textarea h-40 bg-indigo-500/5 border-indigo-500/20 focus:border-indigo-500 font-mono text-sm"
                                placeholder="- Core concept definition&#10;- Correct time complexity&#10;- Edge case handling"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <Icons.Plus className="w-4 h-4" />
                                    Good to Have (Bonus)
                                </label>
                                <textarea
                                    name="goodToHave"
                                    value={rubric.goodToHave}
                                    onChange={handleRubricChange}
                                    className="textarea h-32 bg-purple-500/5 border-purple-500/20 focus:border-purple-500 font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <Icons.Trash className="w-4 h-4" />
                                    Red Flags (Penalties)
                                </label>
                                <textarea
                                    name="redFlags"
                                    value={rubric.redFlags}
                                    onChange={handleRubricChange}
                                    className="textarea h-32 bg-red-500/5 border-red-500/20 focus:border-red-500 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <Link href="/admin/questions" className="btn btn-secondary px-6">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary px-8 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Icons.Check className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
