"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import {
    FileText,
    Sparkles,
    Play,
    Send,
    Lightbulb,
    Check,
    Trophy,
    RotateCcw,
    ChevronLeft,
    AlertCircle,
    Upload,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import AnswerEditor from "@/components/ui/AnswerEditor"

const PHASES = {
    INPUT: 'input',
    ANALYZING: 'analyzing',
    REVIEW: 'review',
    PLANNING: 'planning',
    PLAN_PREVIEW: 'plan_preview',
    QUESTION: 'question',
    EVALUATING: 'evaluating',
    FEEDBACK: 'feedback',
    REPORT: 'report',
}

export default function ResumeBasedPage() {
    const router = useRouter()

    const [phase, setPhase] = useState(PHASES.INPUT)
    const [sessionId, setSessionId] = useState(null)
    const [sessionState, setSessionState] = useState(null)

    // Resume state
    const [resumeText, setResumeText] = useState('')
    const [analysis, setAnalysis] = useState(null)
    const [interviewPlan, setInterviewPlan] = useState(null)

    // Setup options (after analysis)
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

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const textareaRef = useRef(null)
    const fileInputRef = useRef(null)

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError('File size too large (max 5MB)')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await api.parseResume(file)
            setResumeText(response.data.text)
        } catch (err) {
            setError(err.message || 'Failed to upload/parse resume')
        } finally {
            setIsLoading(false)
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const analyzeResume = async () => {
        if (resumeText.trim().length < 50) {
            setError('Please paste a more complete resume (at least 50 characters).')
            return
        }

        setIsLoading(true)
        setError(null)
        setPhase(PHASES.ANALYZING)

        try {
            const response = await api.analyzeResume(resumeText)
            const data = response.data

            setAnalysis(data)
            // Auto-select domain or set to 'General' to bypass selection
            if (data.domains?.length > 0) {
                setSelectedDomain(data.domains[0])
            } else {
                setSelectedDomain('General')
            }
            if (data.suggestedDifficulty) setSelectedDifficulty(data.suggestedDifficulty)

            setPhase(PHASES.REVIEW)
        } catch (err) {
            setError(err.message || 'Failed to analyze resume')
            setPhase(PHASES.INPUT)
        } finally {
            setIsLoading(false)
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
                domain: selectedDomain || 'Resume Based',
                difficulty: selectedDifficulty,
                questionLimit: interviewPlan ? interviewPlan.stages.length : questionLimit,
                mode: 'Resume',
                adaptiveMode: true,
                resumeContext: analysis,
                interviewPlan: interviewPlan
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

    const generatePlan = async () => {
        setIsLoading(true)
        setPhase(PHASES.PLANNING)
        setError(null)
        try {
            const response = await api.generateInterviewPlan(analysis)
            setInterviewPlan(response.data)
            setPhase(PHASES.PLAN_PREVIEW)
        } catch (err) {
            setError(err.message || 'Failed to generate plan')
            setPhase(PHASES.REVIEW)
        } finally {
            setIsLoading(false)
        }
    }

    const submitAnswer = async () => {
        if (!answer.trim()) return
        setIsLoading(true)
        // setPhase(PHASES.EVALUATING) // Skipped, keeping QUESTION phase until next one loads or we report
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
                // Fetch LLM-enhanced report
                try {
                    const reportRes = await api.generateHiringReport(sessionId)
                    setReport(reportRes.data)
                } catch (e) {
                    console.error("Failed to generate AI report, using basic", e)
                    setReport(response.data.report)
                }
                setPhase(PHASES.REPORT)
            } else {
                // SKIP FEEDBACK PHASE - Go directly to next question
                await getNextQuestion()
            }
        } catch (err) {
            setError(err.message || 'Failed to submit answer')
            setPhase(PHASES.QUESTION)
        } finally {
            setIsLoading(false)
        }
    }

    const getNextQuestion = async () => {
        // Only set loading if not already loading (e.g. from submitAnswer)
        if (!isLoading) setIsLoading(true)
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
            await api.endInterview(sessionId)
            try {
                const reportRes = await api.generateHiringReport(sessionId)
                setReport(reportRes.data)
            } catch (e) {
                console.error("Failed to generate AI report", e)
                // Fallback? Or we need to store the basic report somewhere?
                // api.endInterview returns report data. Let's capture it.
                // But wait, generateHiringReport is better.
            }
            setPhase(PHASES.REPORT)
        } catch (err) {
            setError(err.message || 'Failed to end interview')
        } finally {
            setIsLoading(false)
        }
    }

    const resetInterview = () => {
        setPhase(PHASES.INPUT)
        setSessionId(null)
        setSessionState(null)
        setCurrentQuestion(null)
        setAnswer('')
        setEvaluation(null)
        setFeedback(null)
        setReport(null)
        setAnalysis(null)
        setResumeText('')
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
                                <FileText className="w-5 h-5 text-emerald-500" />
                                Resume Based Interview
                            </h1>
                            {sessionState && (
                                <p className="text-sm text-muted-foreground">
                                    Q{sessionState.questionNumber} • {sessionState.currentDifficulty} • {selectedDomain}
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

                {/* INPUT PHASE — Paste Resume */}
                {phase === PHASES.INPUT && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="text-center max-w-2xl mx-auto">

                            <h2 className="text-3xl font-bold text-foreground mb-2">Resume Based Practice</h2>
                            <p className="text-muted-foreground">Paste your resume and get AI-tailored interview questions</p>
                        </div>

                        <Card className="max-w-3xl mx-auto">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="block text-sm font-medium text-foreground">Paste Your Resume</label>
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".pdf,.docx,.doc,.txt"
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isLoading}
                                            className="text-emerald-500 hover:bg-emerald-500/10 h-8"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload File
                                        </Button>
                                    </div>
                                </div>
                                <textarea
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    placeholder={"Paste your full resume text here...\n\nExample:\nJohn Doe\nSoftware Developer | 2 years experience\n\nSkills: Java, React, SQL, Git\n\nExperience:\n- Developed REST APIs using Spring Boot\n- Built React dashboards with real-time data\n- Managed PostgreSQL databases\n\nProjects:\n- E-commerce platform (Java, React)\n- Chat application (Node.js, Socket.io)"}
                                    className="clean-input w-full h-72 font-mono text-sm leading-relaxed resize-none"
                                />
                                <div className="flex items-center justify-between mt-2 px-1">
                                    <p className="text-xs text-muted-foreground">{resumeText.length} characters</p>
                                    <p className="text-xs text-muted-foreground">Minimum 50 characters</p>
                                </div>

                                <Button
                                    className="w-full py-6 mt-6"
                                    onClick={analyzeResume}
                                    disabled={isLoading || resumeText.trim().length < 50}
                                    isLoading={isLoading}
                                    icon={Sparkles}
                                >
                                    Analyze Resume with AI
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ANALYZING PHASE */}
                {phase === PHASES.ANALYZING && (
                    <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-8" />
                        <h3 className="text-2xl font-semibold text-foreground mb-2">Analyzing Your Resume</h3>
                        <p className="text-muted-foreground">Our AI is extracting relevant skills, experience, and projects...</p>
                    </div>
                )}

                {/* REVIEW PHASE — Show analysis results + start interview */}
                {phase === PHASES.REVIEW && analysis && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="text-center">
                            <Badge variant="success" className="mb-4">
                                <Sparkles className="w-3 h-3 mr-2 inline" /> AI Analysis Complete
                            </Badge>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Resume Overview</h2>
                            <p className="text-muted-foreground">Review the extracted details and start your tailored interview</p>
                        </div>

                        {/* Analysis Results */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Skills */}
                            {analysis.skills?.length > 0 && (
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle>🛠️ Skills Detected</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.skills.map((skill, i) => (
                                                <Badge key={i} variant="success">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Experience */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>📈 Profile Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-border">
                                        <span className="text-muted-foreground text-sm">Experience Level</span>
                                        <Badge variant="neutral">{analysis.experience}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-border">
                                        <span className="text-muted-foreground text-sm">Suggested Difficulty</span>
                                        <Badge variant={
                                            analysis.suggestedDifficulty === 'Easy' ? 'success' :
                                                analysis.suggestedDifficulty === 'Medium' ? 'warning' : 'danger'
                                        }>
                                            {analysis.suggestedDifficulty}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Strengths */}
                            {analysis.strengths?.length > 0 && (
                                <Card className="border-emerald-500/20 bg-emerald-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-emerald-500 flex items-center gap-2">
                                            <Check className="w-5 h-5" /> Key Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {analysis.strengths.map((s, i) => (
                                                <li key={i} className="text-muted-foreground text-sm flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Focus Areas */}
                            {analysis.focusAreas?.length > 0 && (
                                <Card className="border-amber-500/20 bg-amber-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-amber-500 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" /> Focus Areas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {analysis.focusAreas.map((f, i) => (
                                                <li key={i} className="text-muted-foreground text-sm flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Projects */}
                        {analysis.projects?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>🚀 Projects Found</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.projects.map((p, i) => (
                                            <Badge key={i} variant="info">
                                                {p}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Interview Setup */}
                        <Card className="border-emerald-500/20">
                            <CardHeader>
                                <CardTitle>Configure Your Interview</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-6">


                                {/* Difficulty */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">Difficulty</label>
                                    <div className="flex gap-2">
                                        {['Easy', 'Medium', 'Hard'].map(diff => (
                                            <button
                                                key={diff}
                                                onClick={() => setSelectedDifficulty(diff)}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${selectedDifficulty === diff
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

                                {/* Start Button */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setPhase(PHASES.INPUT); setAnalysis(null) }}
                                        icon={RotateCcw}
                                    >
                                        Re-upload
                                    </Button>
                                    <Button
                                        className="flex-1 text-lg"
                                        onClick={generatePlan}
                                        disabled={isLoading}
                                        isLoading={isLoading}
                                        icon={Play}
                                    >
                                        Generate Interview Plan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* PLANNING PHASE */}
                {phase === PHASES.PLANNING && (
                    <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                        <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-8" />
                        <h3 className="text-2xl font-semibold text-foreground mb-2">Generating Interview Plan</h3>
                        <p className="text-muted-foreground">Creating a structured interview based on your profile...</p>
                    </div>
                )}

                {/* PLAN_PREVIEW PHASE */}
                {phase === PHASES.PLAN_PREVIEW && interviewPlan && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="text-center">
                            <Badge variant="accent" className="mb-4">
                                <FileText className="w-3 h-3 mr-2 inline" /> Plan Ready
                            </Badge>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Your Interview Roadmap</h2>
                            <p className="text-muted-foreground">Here is how we will structure your session</p>
                        </div>

                        <Card className="max-w-3xl mx-auto border-violet-500/20">
                            <CardContent className="pt-6 space-y-6">
                                {interviewPlan.stages.map((stage, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-surface rounded-xl border border-border">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{stage.type}</h4>
                                            <p className="text-sm text-muted-foreground">{stage.focus}</p>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    className="w-full py-4 text-lg mt-6"
                                    onClick={startInterview}
                                    disabled={isLoading}
                                    isLoading={isLoading}
                                    icon={Play}
                                >
                                    Start Interview
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
                                        <Badge variant="success">Resume Tailored</Badge>
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
                        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-8" />
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
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
                                <Trophy className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Resume Based Interview Complete!</h2>

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
                                                <div className="w-2 h-8 rounded-full bg-emerald-500" />
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
