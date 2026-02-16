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
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500 group-focus-within:opacity-100" />

                <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-colors duration-300 focus-within:border-violet-500/50 focus-within:bg-black/60">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full min-h-[320px] bg-transparent p-6 text-zinc-100 placeholder:text-zinc-600 resize-y focus:outline-none font-mono text-sm leading-8 scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent selection:bg-violet-500/30"
                        spellCheck={false}
                    />

                    {/* Toolbar */}
                    <div className="flex items-center flex-wrap gap-3 px-4 py-3 border-t border-white/5 bg-white/5 backdrop-blur-md">
                        <VoiceInput
                            onTranscript={handleTranscript}
                            disabled={disabled}
                        />

                        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

                        <div className="flex-1 min-w-[200px]">
                            <Whiteboard
                                onSnapshotChange={onDrawingChange}
                                disabled={disabled}
                            />
                        </div>

                        {/* Character count */}
                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 ml-auto">
                            <span>{value.split(/\s+/).filter(Boolean).length} words</span>
                            <span>{value.length} chars</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
