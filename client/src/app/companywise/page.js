"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import {
    Building2,
    Play,
    Send,
    Lightbulb,
    Check,
    Trophy,
    RotateCcw,
    ChevronLeft,
    Clock,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import AnswerEditor from "@/components/ui/AnswerEditor"
import InterviewChat from "@/components/ui/InterviewChat"

const PHASES = {
    SETUP: 'setup',
    QUESTION: 'question',
    EVALUATING: 'evaluating',
    FEEDBACK: 'feedback',
    REPORT: 'report',
}

export default function CompanyWisePage() {
    const router = useRouter()

    // Session state
    const [phase, setPhase] = useState(PHASES.SETUP)
    const [sessionId, setSessionId] = useState(null)
    const [sessionState, setSessionState] = useState(null)

    // Setup state
    const [companies, setCompanies] = useState([])
    const [selectedCompany, setSelectedCompany] = useState('')
    const [domains, setDomains] = useState([])
    const [selectedDomain, setSelectedDomain] = useState('')
    const [selectedDifficulty, setSelectedDifficulty] = useState('Medium')
    const [questionLimit, setQuestionLimit] = useState(10)

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
    const [messages, setMessages] = useState([])

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const textareaRef = useRef(null)

    useEffect(() => {
        loadCompanies()
        loadDomains()
    }, [])

    const loadCompanies = async () => {
        try {
            const response = await api.getCompanies()
            setCompanies(response.data || [])
        } catch (err) {
            console.error('Failed to load companies:', err)
            setCompanies([
                { company: 'Google', questionCount: 0 },
                { company: 'Amazon', questionCount: 0 },
                { company: 'Microsoft', questionCount: 0 },
                { company: 'TCS', questionCount: 0 },
                { company: 'Infosys', questionCount: 0 },
                { company: 'Meta', questionCount: 0 },
            ])
        }
    }

    const loadDomains = async () => {
        try {
            const response = await api.getDomains()
            setDomains(response.data || [])
            if (response.data?.length > 0) {
                setSelectedDomain(response.data[0].domain)
            }
        } catch (err) {
            console.error('Failed to load domains:', err)
            setDomains([
                { domain: 'Java', questionCount: 0 },
                { domain: 'DSA', questionCount: 0 },
                { domain: 'DBMS', questionCount: 0 },
            ])
            setSelectedDomain('Java')
        }
    }

    const startInterview = async () => {
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
                difficulty: selectedDifficulty,
                questionLimit,
                mode: 'Company',
                companyMode: selectedCompany,
            })

            setSessionId(response.data.session.id)
            setSessionState(response.data.state)
            setCurrentQuestion(response.data.question)
            setStartTime(Date.now())
            setPhase(PHASES.QUESTION)

            // Initialize chat with first question
            setMessages([
                {
                    role: 'interviewer',
                    type: 'question',
                    text: response.data.question.text,
                    id: response.data.question.id
                }
            ])
        } catch (err) {
            setError(err.message || 'Failed to start interview')
        } finally {
            setIsLoading(false)
        }
    }

    const askDoubt = async (doubt) => {
        setIsLoading(true)
        try {
            // Add user doubt to chat
            const userDoubt = { role: 'user', type: 'doubt', text: doubt, id: Date.now() }
            setMessages(prev => [...prev, userDoubt])

            const response = await api.askClarification(sessionId, doubt)

            // Add interviewer response
            const interviewerReply = {
                role: 'interviewer',
                type: 'clarification',
                text: response.data.message,
                id: Date.now() + 1
            }
            setMessages(prev => [...prev, interviewerReply])
        } catch (err) {
            console.error('Failed to ask doubt:', err)
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

            // Add user answer to chat
            const userAnswer = { role: 'user', type: 'answer', text: answer.trim(), id: Date.now() }
            setMessages(prev => [...prev, userAnswer])

            const response = await api.submitAnswer(sessionId, {
                questionId: currentQuestion.id,
                answer: answer.trim(),
                responseTimeMs,
                drawingData,
            })

            const { evaluation, feedback, interviewerMessage, state, action, report: sessionReport } = response.data

            setEvaluation(evaluation)
            setFeedback(feedback)
            setSessionState(state)

            // Add interviewer commentary to chat
            if (interviewerMessage) {
                const commentary = {
                    role: 'interviewer',
                    type: 'commentary',
                    text: interviewerMessage.message,
                    evaluation,
                    feedback,
                    id: Date.now() + 1
                }
                setMessages(prev => [...prev, commentary])
            }

            if (action === 'end_session') {
                setReport(sessionReport)
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

            const nextQuestion = response.data.question
            setCurrentQuestion(nextQuestion)
            setSessionState(response.data.state)
            setAnswer('')
            setHint(null)
            setHintCount(0)
            setStartTime(Date.now())
            setPhase(PHASES.QUESTION)

            // Add next question to chat
            const interviewerQuestion = {
                role: 'interviewer',
                type: 'question',
                text: (nextQuestion.interviewerIntro ? nextQuestion.interviewerIntro + " " : "") + nextQuestion.text,
                id: nextQuestion.id
            }
            setMessages(prev => [...prev, interviewerQuestion])
        } catch (err) {
            setError(err.message || 'Failed to get next question')
        } finally {
            setIsLoading(false)
        }
    }

    const getHintHandler = async () => {
        try {
            const response = await api.getHint(sessionId, hintCount + 1)
            const hintText = response.data.hint
            setHint(hintText)
            setHintCount(prev => prev + 1)

            // Add hint as interviewer message
            setMessages(prev => [...prev, {
                role: 'interviewer',
                type: 'hint',
                text: `Hint ${hintCount + 1}: ${hintText}`,
                id: Date.now()
            }])
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
        setMessages([])
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
                                <Building2 className="w-5 h-5 text-blue-500" />
                                Company Wise Interview
                            </h1>
                            {sessionState && (
                                <p className="text-sm text-muted-foreground">
                                    Q{sessionState.questionNumber} • {sessionState.currentDifficulty} • {selectedCompany}
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
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 mb-6">
                                <Building2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Company Wise Practice</h2>
                            <p className="text-muted-foreground">Practice questions frequently asked by top tech companies</p>
                        </div>

                        <Card className="max-w-3xl mx-auto">
                            <CardContent className="space-y-8 pt-6">
                                {/* Company Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">Select Company</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(companies.length > 0 ? companies : [
                                            { company: 'Google', questionCount: 0 },
                                            { company: 'Amazon', questionCount: 0 },
                                            { company: 'Microsoft', questionCount: 0 },
                                            { company: 'TCS', questionCount: 0 },
                                            { company: 'Infosys', questionCount: 0 },
                                            { company: 'Meta', questionCount: 0 },
                                        ]).map(c => (
                                            <button
                                                key={c.company}
                                                onClick={() => setSelectedCompany(c.company)}
                                                className={`p-4 rounded-xl border transition-all text-left group ${selectedCompany === c.company
                                                    ? 'bg-blue-500/10 border-blue-500 text-foreground'
                                                    : 'bg-surface border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                                                    }`}
                                            >
                                                <p className="font-semibold">{c.company}</p>
                                                <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/80 transition-colors">{c.questionCount} questions</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Domain Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">Select Domain</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {domains.map(d => (
                                            <button
                                                key={d.domain}
                                                onClick={() => setSelectedDomain(d.domain)}
                                                className={`p-4 rounded-xl border transition-all text-left ${selectedDomain === d.domain
                                                    ? 'bg-blue-500/10 border-blue-500 text-foreground'
                                                    : 'bg-surface border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                                                    }`}
                                            >
                                                <p className="font-medium">{d.domain}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{d.questionCount} questions</p>
                                            </button>
                                        ))}
                                    </div>
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
                                            Questions: <span className="text-blue-500 font-bold">{questionLimit}</span>
                                        </label>
                                        <input type="range" min="5" max="20" value={questionLimit}
                                            onChange={(e) => setQuestionLimit(parseInt(e.target.value))}
                                            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                                            <span>5 (Quick)</span><span>20 (Full)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Start Button */}
                                <Button
                                    className="w-full py-6 text-lg"
                                    onClick={startInterview}
                                    disabled={isLoading || !selectedDomain || !selectedCompany}
                                    isLoading={isLoading}
                                    icon={Play}
                                >
                                    Start {selectedCompany} Interview
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
                                        {selectedCompany && (
                                            <Badge variant="info">{selectedCompany}</Badge>
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
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-8" />
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
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 text-blue-500 mb-6">
                                <Trophy className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">{selectedCompany} Interview Complete!</h2>

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
                                                <div className="w-2 h-8 rounded-full bg-blue-500" />
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
