"use client";

import { motion } from "framer-motion";
import VoiceInput from "./VoiceInput";
import Whiteboard from "./Whiteboard";

/**
 * AnswerEditor - Unified rich editor for text + voice + whiteboard
 */
export default function AnswerEditor({
    value,
    onChange,
    drawingData,
    onDrawingChange,
    placeholder = "Type your answer here...",
    disabled = false,
    className = ""
}) {
    // Combine text updates
    const handleTranscript = (text) => {
        onChange(value ? value + " " + text : text);
    };

    return (
        <div className={`w-full space-y-4 ${className}`}>
            <label className="block text-sm font-medium text-foreground ml-1 mb-2">
                Your Answer <span className="text-muted-foreground font-normal ml-2 text-xs">(Markdown supported)</span>
            </label>

            <div className="relative group">
                {/* Subtle Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500 group-focus-within:opacity-100" />

                <div className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm transition-all duration-300 focus-within:border-violet-500/30 focus-within:ring-2 focus-within:ring-violet-500/5">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full min-h-[320px] bg-transparent p-6 text-foreground placeholder:text-muted-foreground resize-y focus:outline-none font-sans text-sm leading-7 scrollbar-thin scrollbar-thumb-violet-500/10 scrollbar-track-transparent selection:bg-violet-500/10"
                        spellCheck={false}
                    />

                    {/* Toolbar */}
                    <div className="flex items-center flex-wrap gap-3 px-4 py-3 border-t border-border bg-surface/30">
                        <VoiceInput
                            onTranscript={handleTranscript}
                            disabled={disabled}
                        />

                        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                        <div className="flex-1 min-w-[200px]">
                            <Whiteboard
                                onSnapshotChange={onDrawingChange}
                                disabled={disabled}
                            />
                        </div>

                        {/* Character count */}
                        <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground ml-auto">
                            <span>{value.split(/\s+/).filter(Boolean).length} words</span>
                            <span>{value.length} chars</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
