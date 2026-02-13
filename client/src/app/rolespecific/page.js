"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import {
    Briefcase,
    Play,
    Send,
    Lightbulb,
    Check,
    Trophy,
    RotateCcw,
    ChevronLeft,
    AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

const PHASES = {
    SETUP: 'setup',
    QUESTION: 'question',
    EVALUATING: 'evaluating',
    FEEDBACK: 'feedback',
    REPORT: 'report',
}

const ROLES = [
    {
        id: 'frontend',
        title: 'Frontend Developer',
        emoji: '🎨',
        desc: 'React, JavaScript, CSS, HTML, Web APIs',
        domains: ['React', 'JavaScript', 'CSS', 'HTML'],
        defaultDifficulty: { 'Fresher': 'Easy', '1-3 years': 'Medium', '3-5 years': 'Hard', 'Senior': 'Hard' },
    },
    {
        id: 'backend',
        title: 'Backend Developer',
        emoji: '⚙️',
        desc: 'Java, DBMS, OS, System Design',
        domains: ['Java', 'DBMS', 'OS', 'System Design'],
        defaultDifficulty: { 'Fresher': 'Easy', '1-3 years': 'Medium', '3-5 years': 'Hard', 'Senior': 'Hard' },
    },
    {
        id: 'fullstack',
        title: 'Full Stack Developer',
        emoji: '🔗',
        desc: 'React, Java, DBMS, JavaScript, System Design',
        domains: ['React', 'Java', 'DBMS', 'JavaScript', 'System Design'],
        defaultDifficulty: { 'Fresher': 'Easy', '1-3 years': 'Medium', '3-5 years': 'Hard', 'Senior': 'Hard' },
    },
    {
        id: 'devops',
        title: 'DevOps Engineer',
        emoji: '🚀',
        desc: 'OS, Networking, Cloud, System Design',
        domains: ['OS', 'Networking', 'Cloud', 'System Design'],
        defaultDifficulty: { 'Fresher': 'Easy', '1-3 years': 'Medium', '3-5 years': 'Hard', 'Senior': 'Hard' },
    },
    {
        id: 'data_analyst',
        title: 'Data Analyst',
        emoji: '📊',
        desc: 'DBMS, Python, Statistics, SQL',
        domains: ['DBMS', 'Python', 'Statistics', 'SQL'],
        defaultDifficulty: { 'Fresher': 'Easy', '1-3 years': 'Medium', '3-5 years': 'Hard', 'Senior': 'Hard' },
    },
    {
        id: 'dsa',
        title: 'DSA / Competitive',
        emoji: '🧠',
        desc: 'Data Structures, Algorithms, Problem Solving',
        domains: ['DSA'],
        defaultDifficulty: { 'Fresher': 'Easy', '1-3 years': 'Medium', '3-5 years': 'Hard', 'Senior': 'Hard' },
    },
]

const EXPERIENCE_LEVELS = ['Fresher', '1-3 years', '3-5 years', 'Senior']

export default function RoleSpecificPage() {
    const router = useRouter()

    const [phase, setPhase] = useState(PHASES.SETUP)
    const [sessionId, setSessionId] = useState(null)
    const [sessionState, setSessionState] = useState(null)

    // Setup state
    const [availableDomains, setAvailableDomains] = useState([])
    const [selectedRole, setSelectedRole] = useState(null)
    const [selectedExperience, setSelectedExperience] = useState('Fresher')
    const [selectedDifficulty, setSelectedDifficulty] = useState('Medium')
    const [questionLimit, setQuestionLimit] = useState(10)

    // Question state
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [answer, setAnswer] = useState('')
    const [startTime, setStartTime] = useState(null)
    const [hint, setHint] = useState(null)
    const [hintCount, setHintCount] = useState(0)

    // Evaluation state
    const [evaluation, setEvaluation] = useState(null)
    const [feedback, setFeedback] = useState(null)

    // Report state
    const [report, setReport] = useState(null)

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const textareaRef = useRef(null)

    useEffect(() => {
        loadDomains()
    }, [])

    useEffect(() => {
        if (selectedRole) {
            const auto = selectedRole.defaultDifficulty[selectedExperience] || 'Medium'
            setSelectedDifficulty(auto)
        }
    }, [selectedRole, selectedExperience])

    const loadDomains = async () => {
        try {
            const response = await api.getDomains()
            setAvailableDomains((response.data || []).map(d => d.domain))
        } catch (err) {
            console.error('Failed to load domains:', err)
            setAvailableDomains(['Java', 'DSA', 'DBMS', 'React', 'JavaScript', 'OS'])
        }
    }

    const getMatchingDomain = () => {
        if (!selectedRole) return null
        for (const d of selectedRole.domains) {
            if (availableDomains.includes(d)) return d
        }
        return availableDomains[0] || null
    }

    const startInterview = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const domain = getMatchingDomain()
            if (!domain) throw new Error('No matching domain found for this role')

            let userId
            const userStr = localStorage.getItem('user')
            if (userStr) {
                try {
                    const user = JSON.parse(userStr)
                    userId = user.id
                } catch (e) { console.error('Failed to parse user', e) }
            }
            if (!userId) userId = 'demo-user-' + Date.now()

            const response = await api.startInterview({
                userId,
                domain,
                difficulty: selectedDifficulty,
                questionLimit,
                mode: 'Practice',
            })

            setSessionId(response.data.session.id)
            setSessionState(response.data.state)
            setCurrentQuestion(response.data.question)
            setStartTime(Date.now())
            setPhase(PHASES.QUESTION)
        } catch (err) {
            setError(err.message || 'Failed to start interview')
        } finally {
            setIsLoading(false)
        }
    }

    const submitAnswer = async () => {
        if (!answer.trim()) return
        setIsLoading(true)
        setPhase(PHASES.EVALUATING)
        setError(null)

        try {
            const responseTimeMs = Date.now() - startTime
            const response = await api.submitAnswer(sessionId, {
                questionId: currentQuestion.id,
                answer: answer.trim(),
                responseTimeMs,
            })
            setEvaluation(response.data.evaluation)
            setFeedback(response.data.feedback)
            setSessionState(response.data.state)

            if (response.data.action === 'end_session') {
                setReport(response.data.report)
                setPhase(PHASES.REPORT)
            } else {
                setPhase(PHASES.FEEDBACK)
            }
        } catch (err) {
            setError(err.message || 'Failed to submit answer')
            setPhase(PHASES.QUESTION)
        } finally {
            setIsLoading(false)
        }
    }

    const getNextQuestion = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.getNextQuestion(sessionId)
            if (response.data.action === 'end_session') {
                await endInterview()
                return
            }
            setCurrentQuestion(response.data.question)
            setSessionState(response.data.state)
            setAnswer('')
            setHint(null)
            setHintCount(0)
            setStartTime(Date.now())
            setPhase(PHASES.QUESTION)
        } catch (err) {
            setError(err.message || 'Failed to get next question')
        } finally {
            setIsLoading(false)
        }
    }

    const getHintHandler = async () => {
        try {
            const response = await api.getHint(sessionId, hintCount + 1)
            setHint(response.data.hint)
            setHintCount(prev => prev + 1)
        } catch (err) {
            console.error('Failed to get hint:', err)
        }
    }

    const endInterview = async () => {
        setIsLoading(true)
        try {
            const response = await api.endInterview(sessionId)
            setReport(response.data)
            setPhase(PHASES.REPORT)
        } catch (err) {
            setError(err.message || 'Failed to end interview')
        } finally {
            setIsLoading(false)
        }
    }

    const resetInterview = () => {
        setPhase(PHASES.SETUP)
        setSessionId(null)
        setSessionState(null)
        setCurrentQuestion(null)
        setAnswer('')
        setEvaluation(null)
        setFeedback(null)
        setReport(null)
        setHint(null)
        setHintCount(0)
        setError(null)
    }

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-emerald-500'
        if (score >= 6) return 'text-amber-500'
        if (score >= 4) return 'text-orange-500'
        return 'text-red-500'
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/interview" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-surface rounded-lg">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-amber-500" />
                                Role Specific Interview
                            </h1>
                            {sessionState && selectedRole && (
                                <p className="text-sm text-muted-foreground">
                                    Q{sessionState.questionNumber} • {selectedRole.title} • {selectedExperience}
                                </p>
                            )}
                        </div>
                    </div>
                    {sessionId && phase !== PHASES.REPORT && (
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-muted-foreground">Remaining</p>
                                <p className="text-lg font-bold text-foreground tabular-nums">{sessionState?.questionsRemaining || '--'}</p>
                            </div>
                            <Button variant="danger" size="sm" onClick={endInterview} disabled={isLoading}>
                                End Session
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* SETUP PHASE */}
                {phase === PHASES.SETUP && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-3xl mb-4">
                                👤
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Role Specific Practice</h2>
                            <p className="text-muted-foreground">Prepare for specific job roles with targeted questions</p>
                        </div>

                        <Card className="max-w-3xl mx-auto">
                            <CardContent className="space-y-8 pt-6">
                                {/* Role Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">Select Role</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {ROLES.map(role => (
                                            <button
                                                key={role.id}
                                                onClick={() => setSelectedRole(role)}
                                                className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group ${selectedRole?.id === role.id
                                                    ? `bg-surface border-amber-500 ring-1 ring-amber-500/20`
                                                    : 'bg-surface border-border hover:border-foreground/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-2xl">{role.emoji}</span>
                                                    <span className={`font-semibold ${selectedRole?.id === role.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                        {role.title}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-3">{role.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience & Difficulty */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-3">Experience Level</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {EXPERIENCE_LEVELS.map(level => (
                                                <button
                                                    key={level}
                                                    onClick={() => setSelectedExperience(level)}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${selectedExperience === level
                                                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                                                        : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-3 flex justify-between">
                                            Difficulty <span className="text-muted-foreground font-normal text-xs">(auto-set)</span>
                                        </label>
                                        <div className="flex gap-2">
                                            {['Easy', 'Medium', 'Hard'].map(diff => (
                                                <button
                                                    key={diff}
                                                    onClick={() => setSelectedDifficulty(diff)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${selectedDifficulty === diff
                                                        ? diff === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                                            : diff === 'Medium' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                                                                : 'bg-red-500/10 border-red-500/50 text-red-500'
                                                        : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    {diff}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Start Button */}
                                <div className="pt-4">
                                    <Button
                                        className="w-full py-6 text-lg"
                                        onClick={startInterview}
                                        disabled={isLoading || !selectedRole || !getMatchingDomain()}
                                        isLoading={isLoading}
                                        icon={Play}
                                    >
                                        Start {selectedRole?.title || 'Interview'}
                                    </Button>
                                    {selectedRole && !getMatchingDomain() && (
                                        <p className="text-red-500 text-sm text-center mt-2">
                                            No questions available for the selected role&apos;s domains.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* QUESTION PHASE */}
                {phase === PHASES.QUESTION && currentQuestion && (
                    <div className="space-y-6 animate-fade-in">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="neutral">Q{currentQuestion.number}</Badge>
                                        <Badge variant={
                                            currentQuestion.difficulty === 'Easy' ? 'success' :
                                                currentQuestion.difficulty === 'Medium' ? 'warning' : 'danger'
                                        }>
                                            {currentQuestion.difficulty}
                                        </Badge>
                                        {selectedRole && (
                                            <Badge variant="warning">
                                                {selectedRole.emoji} {selectedRole.title}
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-sm font-mono text-muted-foreground">{currentQuestion.topic}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <h3 className="text-xl text-foreground font-medium leading-relaxed">{currentQuestion.text}</h3>

                                {hint && (
                                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-fade-in">
                                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                                            <Lightbulb className="w-5 h-5" />
                                            <span className="font-semibold">Hint {hintCount}</span>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">{hint}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <label className="block text-sm font-medium text-foreground mb-4">Your Answer</label>
                                <textarea
                                    ref={textareaRef}
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type your answer here... Be thorough and explain your reasoning."
                                    className="clean-input w-full h-64 font-mono text-sm leading-relaxed resize-none"
                                />
                                <div className="flex items-center justify-between mt-6">
                                    <Button
                                        variant="ghost"
                                        onClick={getHintHandler}
                                        disabled={hintCount >= 3}
                                        icon={Lightbulb}
                                        className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                    >
                                        Get Hint ({3 - hintCount} left)
                                    </Button>
                                    <Button
                                        onClick={submitAnswer}
                                        disabled={!answer.trim() || isLoading}
                                        isLoading={isLoading}
                                        icon={Send}
                                        className="px-8"
                                    >
                                        Submit Answer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* EVALUATING PHASE */}
                {phase === PHASES.EVALUATING && (
                    <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                        <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-8" />
                        <h3 className="text-2xl font-semibold text-foreground mb-2">Evaluating Your Answer</h3>
                        <p className="text-muted-foreground">Our AI is analyzing your response...</p>
                    </div>
                )}

                {/* FEEDBACK PHASE */}
                {phase === PHASES.FEEDBACK && evaluation && (
                    <div className="space-y-6 animate-fade-in">
                        <Card className="text-center py-10">
                            <div className={`text-7xl font-bold mb-2 tracking-tighter ${getScoreColor(evaluation.score)}`}>
                                {evaluation.score?.toFixed?.(1) || evaluation.score}
                            </div>
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Score out of 10</p>
                        </Card>

                        {evaluation.scoreBreakdown && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="text-center p-4">
                                    <p className="text-3xl font-bold text-emerald-500 mb-1">{evaluation.scoreBreakdown.mustHaveScore?.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Core Points</p>
                                </Card>
                                <Card className="text-center p-4">
                                    <p className="text-3xl font-bold text-blue-500 mb-1">{evaluation.scoreBreakdown.goodToHaveScore?.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Bonus</p>
                                </Card>
                                <Card className="text-center p-4">
                                    <p className="text-3xl font-bold text-violet-500 mb-1">{evaluation.scoreBreakdown.clarityScore?.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Clarity</p>
                                </Card>
                                <Card className="text-center p-4">
                                    <p className="text-3xl font-bold text-red-500 mb-1">-{evaluation.scoreBreakdown.penalty?.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Penalty</p>
                                </Card>
                            </div>
                        )}

                        {feedback && (
                            <Card className="space-y-6">
                                <CardContent className="pt-6">
                                    <div className="p-4 bg-surface rounded-xl border border-border mb-6">
                                        <p className="text-foreground leading-relaxed">{feedback.summary}</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {feedback.didWell?.length > 0 && (
                                            <div>
                                                <h5 className="text-emerald-500 font-semibold mb-3 flex items-center gap-2">
                                                    <Check className="w-5 h-5" /> What You Did Well
                                                </h5>
                                                <ul className="space-y-2">
                                                    {feedback.didWell.map((item, i) => (
                                                        <li key={i} className="text-muted-foreground text-sm pl-7 relative">
                                                            <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {feedback.needsImprovement?.length > 0 && (
                                            <div>
                                                <h5 className="text-amber-500 font-semibold mb-3 flex items-center gap-2">
                                                    <Lightbulb className="w-5 h-5" /> Areas for Improvement
                                                </h5>
                                                <ul className="space-y-2">
                                                    {feedback.needsImprovement.map((item, i) => (
                                                        <li key={i} className="text-muted-foreground text-sm pl-7 relative">
                                                            <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={getNextQuestion}
                                disabled={isLoading}
                                isLoading={isLoading}
                                size="xl"
                                className="px-12"
                            >
                                Next Question
                            </Button>
                        </div>
                    </div>
                )}

                {/* REPORT PHASE */}
                {phase === PHASES.REPORT && report && (
                    <div className="space-y-8 animate-fade-in">
                        <Card className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 mb-6">
                                <Trophy className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">{selectedRole?.title} Interview Complete!</h2>

                            <div className={`text-6xl font-bold my-6 ${getScoreColor(report.overallScore)}`}>
                                {report.overallScore?.toFixed?.(1) || report.overallScore}
                            </div>

                            <p className="text-muted-foreground mt-6 font-medium">
                                <span className="text-foreground">{report.questionsAttempted}</span> questions answered in <span className="text-foreground">{report.sessionDuration}</span> minutes
                            </p>
                        </Card>

                        {report.topicBreakdown && Object.keys(report.topicBreakdown).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Topic Performance</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.entries(report.topicBreakdown).map(([topic, data]) => (
                                        <div key={topic} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-8 rounded-full bg-amber-500" />
                                                <span className="text-foreground font-medium">{topic}</span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-muted-foreground text-sm">{data.questions} questions</span>
                                                <span className={`text-xl font-bold ${getScoreColor(data.averageScore)}`}>
                                                    {data.averageScore?.toFixed?.(1) || data.averageScore}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            {report.strengths?.length > 0 && (
                                <Card className="border-emerald-500/20 bg-emerald-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-emerald-500 flex items-center gap-2">
                                            <Check className="w-5 h-5" /> Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {report.strengths.map((s, i) => (
                                                <li key={i} className="text-muted-foreground flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                            {report.weaknesses?.length > 0 && (
                                <Card className="border-amber-500/20 bg-amber-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-amber-500 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" /> Areas to Improve
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {report.weaknesses.map((w, i) => (
                                                <li key={i} className="text-muted-foreground flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="flex justify-center gap-4 pt-8">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => router.push('/interview')}
                                icon={ChevronLeft}
                            >
                                Back to Modes
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={resetInterview}
                                icon={RotateCcw}
                            >
                                Start New Session
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
