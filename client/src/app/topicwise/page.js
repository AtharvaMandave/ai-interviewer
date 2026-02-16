"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import {
    BookOpen,
    Play,
    Send,
    Lightbulb,
    Check,
    Trophy,
    RotateCcw,
    ChevronLeft,
    AlertCircle,
    Layers,
    Hash
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import AnswerEditor from "@/components/ui/AnswerEditor"

const PHASES = {
    SETUP: 'setup',
    QUESTION: 'question',
    EVALUATING: 'evaluating',
    FEEDBACK: 'feedback',
    REPORT: 'report',
}

export default function TopicWisePage() {
    const router = useRouter()

    const [phase, setPhase] = useState(PHASES.SETUP)
    const [sessionId, setSessionId] = useState(null)
    const [sessionState, setSessionState] = useState(null)

    // Setup state
    const [availableDomains, setAvailableDomains] = useState([])
    const [availableTopics, setAvailableTopics] = useState([])
    const [selectedDomain, setSelectedDomain] = useState(null)
    const [selectedTopic, setSelectedTopic] = useState(null)
    const [selectedDifficulty, setSelectedDifficulty] = useState('Medium')
    const [questionLimit, setQuestionLimit] = useState(10)
    const [adaptiveMode, setAdaptiveMode] = useState(false)

    // Question state
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [answer, setAnswer] = useState('')
    const [drawingData, setDrawingData] = useState(null)
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
        if (selectedDomain) {
            loadTopics(selectedDomain)
        } else {
            setAvailableTopics([])
            setSelectedTopic(null)
        }
    }, [selectedDomain])

    const loadDomains = async () => {
        try {
            const response = await api.getDomains()
            setAvailableDomains((response.data || []).map(d => d.domain))
        } catch (err) {
            console.error('Failed to load domains:', err)
            // Fallback for demo/dev
            setAvailableDomains(['Frontend', 'Backend', 'Fullstack', 'DevOps', 'DSA'])
        }
    }

    const loadTopics = async (domain) => {
        setIsLoading(true)
        try {
            const response = await api.getInterviewTopics(domain)
            // Expecting response.data to be an array of strings like ['React', 'Vue', 'Angular']
            setAvailableTopics(response.data?.topics || [])
        } catch (err) {
            console.error(`Failed to load topics for ${domain}:`, err)
            // Fallback for demo if API fails/is mocked
            if (domain === 'Frontend') setAvailableTopics(['React', 'JavaScript', 'CSS', 'HTML', 'Next.js'])
            else if (domain === 'Backend') setAvailableTopics(['Node.js', 'Express', 'Java', 'Python', 'SQL'])
            else setAvailableTopics(['General', 'System Design', 'Algorithms'])
        } finally {
            setIsLoading(false)
        }
    }

    const startInterview = async () => {
        if (!selectedDomain || !selectedTopic) {
            setError('Please select both a domain and a topic.')
            return
        }
        setIsLoading(true)
        setError(null)

        try {
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
                domain: selectedDomain,
                topic: selectedTopic,
                difficulty: selectedDifficulty,
                questionLimit,
                mode: 'Topic',
                adaptiveMode,
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
                drawingData,
            })
            setEvaluation(response.data.evaluation)
            setFeedback(response.data.feedback)
            setSessionState(response.data.state)

            if (response.data.action === 'end_session') {
                if (adaptiveMode) {
                    try {
                        const aiReport = await api.generateHiringReport(sessionId)
                        setReport(aiReport.data)
                    } catch (e) {
                        setReport(response.data.report)
                    }
                } else {
                    setReport(response.data.report)
                }
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
            if (adaptiveMode) {
                try {
                    const aiReport = await api.generateHiringReport(sessionId)
                    setReport(aiReport.data)
                } catch (e) {
                    setReport(response.data)
                }
            } else {
                setReport(response.data)
            }
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
        if (score >= 8) return 'text-violet-500'
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
                                <BookOpen className="w-5 h-5 text-violet-500" />
                                Topic Wise Interview
                            </h1>
                            {sessionState && selectedTopic && (
                                <p className="text-sm text-muted-foreground">
                                    Q{sessionState.questionNumber} • {selectedTopic} • {selectedDifficulty}
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
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-500 mb-6">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Topic Wise Practice</h2>
                            <p className="text-muted-foreground">Deep dive into specific subjects like React, Node.js, or System Design</p>
                        </div>

                        <Card className="max-w-3xl mx-auto">
                            <CardContent className="space-y-8 pt-6">
                                {/* Domain Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">Step 1: Select Domain</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {availableDomains.map(d => (
                                            <button
                                                key={d}
                                                onClick={() => { setSelectedDomain(d); setSelectedTopic(null); }}
                                                className={`p-4 rounded-xl border transition-all text-left ${selectedDomain === d
                                                    ? 'bg-violet-500/10 border-violet-500 text-foreground'
                                                    : 'bg-surface border-border text-muted-foreground hover:border-foreground/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-4 h-4 opacity-50" />
                                                    <span className="font-semibold">{d}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Selection */}
                                <div className={`transition-all duration-300 ${selectedDomain ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <label className="block text-sm font-medium text-foreground mb-3">Step 2: Select Topic</label>
                                    {isLoading && !availableTopics.length ? (
                                        <div className="py-8 text-center text-muted-foreground">
                                            <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
                                            Loading topics...
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {availableTopics.length > 0 ? availableTopics.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setSelectedTopic(t)}
                                                    className={`p-3 rounded-lg border transition-all text-sm font-medium ${selectedTopic === t
                                                        ? 'bg-violet-500/10 border-violet-500 text-violet-500'
                                                        : 'bg-surface border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                                                        }`}
                                                >
                                                    {t}
                                                </button>
                                            )) : (
                                                <p className="text-muted-foreground text-sm col-span-full py-2 italic text-center">Select a domain to see available topics</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Difficulty */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-3">Difficulty</label>
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

                                    {/* Question Limit */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-3">
                                            Questions: <span className="text-violet-500 font-bold">{questionLimit}</span>
                                        </label>
                                        <input type="range" min="5" max="20" value={questionLimit}
                                            onChange={(e) => setQuestionLimit(parseInt(e.target.value))}
                                            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-violet-500"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                                            <span>5 (Quick)</span><span>20 (Full)</span>
                                        </div>
                                    </div>

                                    {/* Adaptive Mode Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border mt-6 cursor-pointer hover:border-violet-500/50 transition-colors" onClick={() => setAdaptiveMode(!adaptiveMode)}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${adaptiveMode ? 'bg-violet-500/20 text-violet-500' : 'bg-muted text-muted-foreground'}`}>
                                                <Lightbulb className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-0.5 cursor-pointer">Adaptive AI Mode</label>
                                                <p className="text-xs text-muted-foreground">AI adjusts difficulty based on your performance</p>
                                            </div>
                                        </div>
                                        <div className={`w-11 h-6 rounded-full p-1 transition-colors relative ${adaptiveMode ? 'bg-violet-500' : 'bg-muted'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${adaptiveMode ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Start Button */}
                                <Button
                                    className="w-full py-6 text-lg mt-4"
                                    onClick={startInterview}
                                    disabled={isLoading || !selectedDomain || !selectedTopic}
                                    isLoading={isLoading}
                                    icon={Play}
                                >
                                    Start {selectedTopic || 'Topic'} Quiz
                                </Button>
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
                                        {selectedTopic && (
                                            <Badge variant="accent">
                                                <Hash className="w-3 h-3 mr-1 inline" /> {selectedTopic}
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
                                <AnswerEditor
                                    value={answer}
                                    onChange={setAnswer}
                                    onDrawingChange={setDrawingData}
                                    disabled={isLoading}
                                    placeholder="Type your answer here... Be thorough and explain your reasoning."
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
                        <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-8" />
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
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-500/10 text-violet-500 mb-6">
                                <Trophy className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">{selectedTopic} Interview Complete!</h2>

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
                                                <div className="w-2 h-8 rounded-full bg-violet-500" />
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
