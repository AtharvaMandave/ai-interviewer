"use client";

import { useState, useEffect, useRef } from "react";
import {
    Send,
    Volume2,
    HelpCircle,
    User,
    Bot,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    AlertCircle,
    Info,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import puter from "@heyputer/puter.js";
import { Badge } from "./Badge";
import AnswerEditor from "./AnswerEditor";
import { Button } from "./Button";

/**
 * InterviewChat - Converstational UI for the interview experience
 */
export default function InterviewChat({
    messages,
    onSendMessage,
    onAskDoubt,
    onNextQuestion,
    onGetHint,
    onEndInterview,
    isLoading,
    currentQuestion,
    phase, // 'setup', 'question', 'evaluating', 'feedback', 'report'
    hintCount = 0,
}) {
    const [inputText, setInputText] = useState("");
    const [doubtText, setDoubtText] = useState("");
    const [showDoubtInput, setShowDoubtInput] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [expandedFeedback, setExpandedFeedback] = useState({});
    const [drawingData, setDrawingData] = useState(null);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Handle TTS with Puter.js
    const speakMessage = async (text) => {
        if (isSpeaking) return;
        try {
            setIsSpeaking(true);
            const audio = await puter.ai.txt2speech(text);
            audio.onended = () => setIsSpeaking(false);
            audio.play();
        } catch (err) {
            console.error("[InterviewChat] TTS failed:", err);
            setIsSpeaking(false);
        }
    };

    // Auto-read new interviewer messages if they are questions or commentary
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'interviewer' && (lastMessage.type === 'question' || lastMessage.type === 'commentary')) {
            speakMessage(lastMessage.text);
        }
    }, [messages.length]);

    const handleSendAnswer = () => {
        if (!inputText.trim() || isLoading) return;
        onSendMessage(inputText, drawingData);
        setInputText("");
        setDrawingData(null);
    };

    const handleAskDoubt = () => {
        if (!doubtText.trim() || isLoading) return;
        onAskDoubt(doubtText);
        setDoubtText("");
        setShowDoubtInput(false);
    };

    const toggleFeedback = (msgId) => {
        setExpandedFeedback(prev => ({
            ...prev,
            [msgId]: !prev[msgId]
        }));
    };

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 6) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] max-w-5xl mx-auto bg-card rounded-3xl border border-border shadow-xl overflow-hidden animate-fade-in transition-all duration-300">
            {/* Chat Thread */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={msg.id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 hover:scale-105 ${msg.role === 'user'
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-surface border border-border text-muted-foreground'
                                }`}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-violet-500" />}
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`group relative p-4 md:p-5 rounded-3xl transition-all duration-300 ${msg.role === 'user'
                                        ? 'bg-violet-600 text-white rounded-tr-none shadow-lg shadow-violet-500/10'
                                        : 'bg-surface border border-border text-foreground rounded-tl-none hover:border-violet-500/20'
                                    }`}>
                                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
                                        {msg.text}
                                    </p>

                                    {/* Action icons for interviewerBubbles */}
                                    {msg.role === 'interviewer' && (
                                        <button
                                            onClick={() => speakMessage(msg.text)}
                                            className="absolute top-4 right-4 text-muted-foreground/40 hover:text-violet-500 transition-colors"
                                            title="Speak"
                                        >
                                            <Volume2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Sub-elements in interviewer bubble (e.g., Score, Feedback) */}
                                    {msg.type === 'commentary' && msg.evaluation && (
                                        <div className="mt-4 pt-4 border-t border-border/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${getScoreColor(msg.evaluation.score)}`}>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {msg.evaluation.score.toFixed(1)} / 10
                                                </div>
                                                <button
                                                    onClick={() => toggleFeedback(msg.id || idx)}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-violet-600 transition-colors"
                                                >
                                                    {expandedFeedback[msg.id || idx] ? 'Hide' : 'View'} Feedback
                                                    {expandedFeedback[msg.id || idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {expandedFeedback[msg.id || idx] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden space-y-4"
                                                    >
                                                        {msg.feedback?.didWell?.length > 0 && (
                                                            <div>
                                                                <h6 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Strengths</h6>
                                                                <ul className="space-y-1.5">
                                                                    {msg.feedback.didWell.map((item, i) => (
                                                                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {msg.feedback?.needsImprovement?.length > 0 && (
                                                            <div>
                                                                <h6 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Areas for Improvement</h6>
                                                                <ul className="space-y-1.5">
                                                                    {msg.feedback.needsImprovement.map((item, i) => (
                                                                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-2 font-medium px-1">
                                    {msg.role === 'user' ? 'You' : 'Interviewer'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {/* Loading/Thinking Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center text-violet-500 shadow-sm">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-surface border border-border p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
                                <div className="flex gap-1">
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground animate-pulse">Thinking...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-6 md:p-8 bg-card border-t border-border space-y-6">
                {/* Question Metadata & Actions (Hints) */}
                {(phase === 'question' || phase === 'feedback') && currentQuestion && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Badge variant="neutral" className="bg-surface border-border text-muted-foreground">Q{currentQuestion.number}</Badge>
                            <Badge variant="info">Topic: {currentQuestion.topic}</Badge>
                            <Badge variant={
                                currentQuestion.difficulty === 'Easy' ? 'success' :
                                    currentQuestion.difficulty === 'Medium' ? 'warning' : 'danger'
                            }>
                                {currentQuestion.difficulty}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDoubtInput(!showDoubtInput)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-300 flex items-center gap-2 ${showDoubtInput
                                        ? 'bg-violet-600 text-white border-violet-600'
                                        : 'bg-surface text-muted-foreground border-border hover:border-violet-500/40 hover:text-violet-600'
                                    }`}
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                Ask a Doubt
                            </button>
                            <button
                                onClick={onGetHint}
                                disabled={hintCount >= 3 || isLoading}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                            >
                                Hint ({3 - hintCount} left)
                            </button>
                        </div>
                    </div>
                )}

                {/* Doubt Clarification Input */}
                <AnimatePresence>
                    {showDoubtInput && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="relative overflow-hidden"
                        >
                            <div className="p-4 bg-violet-500/[0.03] border border-violet-500/10 rounded-2xl flex gap-3 group focus-within:border-violet-500/30 transition-all duration-300">
                                <input
                                    type="text"
                                    value={doubtText}
                                    onChange={(e) => setDoubtText(e.target.value)}
                                    placeholder="What do you want to clarify about the question?"
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60 p-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAskDoubt()}
                                />
                                <button
                                    onClick={handleAskDoubt}
                                    disabled={!doubtText.trim() || isLoading}
                                    className="p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition shadow-md disabled:bg-violet-400"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main answer editor / Next Question */}
                {phase === 'question' ? (
                    <div className="space-y-6">
                        <AnswerEditor
                            value={inputText}
                            onChange={setInputText}
                            onDrawingChange={setDrawingData}
                            disabled={isLoading}
                            placeholder="Think out loud. Type your answer and explain your reasoning..."
                        />
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleSendAnswer}
                                disabled={!inputText.trim() || isLoading}
                                isLoading={isLoading}
                                icon={Send}
                                className="px-10 py-6 text-base shadow-xl shadow-violet-500/10 hover:shadow-violet-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Submit Answer
                            </Button>
                        </div>
                    </div>
                ) : phase === 'feedback' ? (
                    <div className="flex justify-center pt-2">
                        <Button
                            onClick={onNextQuestion}
                            isLoading={isLoading}
                            className="px-12 py-6 text-lg tracking-tight shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Continue to Next Question
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
