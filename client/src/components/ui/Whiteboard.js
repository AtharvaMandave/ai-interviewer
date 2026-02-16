"use client";

import { useState, useRef, useCallback } from "react";
import { Pencil, X, Maximize2, Minimize2 } from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic import tldraw to avoid SSR issues
const TldrawEditor = dynamic(
    () => import("./WhiteboardCanvas"),
    { ssr: false, loading: () => <WhiteboardSkeleton /> }
);

function WhiteboardSkeleton() {
    return (
        <div className="w-full h-[400px] bg-surface/50 rounded-xl border border-white/10 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <span className="text-sm font-medium">Loading canvas...</span>
            </div>
        </div>
    );
}

/**
 * Whiteboard - Collapsible drawing panel using tldraw
 * Enhanced with Framer Motion
 */
export default function Whiteboard({ onSnapshotChange, disabled = false, className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const editorRef = useRef(null);

    const handleToggle = useCallback(() => {
        setIsOpen(prev => !prev);
        if (isOpen) {
            setIsExpanded(false);
        }
    }, [isOpen]);

    const handleEditorMount = useCallback((editor) => {
        editorRef.current = editor;
    }, []);

    const handleChange = useCallback((snapshot) => {
        onSnapshotChange?.(snapshot);
    }, [onSnapshotChange]);

    return (
        <div className={`${className}`}>
            {/* Toggle button */}
            <motion.button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                    transition-colors duration-300 border backdrop-blur-md shadow-lg
                    ${isOpen
                        ? "bg-violet-500/10 border-violet-500/40 text-violet-400 hover:bg-violet-500/20"
                        : "bg-surface/50 border-white/10 text-muted-foreground hover:text-foreground hover:border-violet-500/30 hover:bg-white/5"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
            >
                {isOpen ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                <span>{isOpen ? "Close Board" : "Whiteboard"}</span>
            </motion.button>

            {/* Whiteboard panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{
                            opacity: 1,
                            height: isExpanded ? "auto" : "auto",
                            marginTop: 12
                        }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={`
                            rounded-xl border border-white/10 overflow-hidden bg-surface/50 backdrop-blur-sm
                            ${isExpanded ? "fixed inset-4 z-50 mt-0 bg-background/95 shadow-2xl border-violet-500/20" : "relative w-full"}
                        `}
                    >
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-violet-500/10">
                                    <Pencil className="w-4 h-4 text-violet-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-foreground">Scratchpad</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(prev => !prev)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                    title={isExpanded ? "Minimize" : "Maximize"}
                                >
                                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleToggle}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className={`relative ${isExpanded ? "h-[calc(100%-60px)]" : "h-[450px]"}`}>
                            <TldrawEditor
                                onMount={handleEditorMount}
                                onChange={handleChange}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expanded backdrop */}
            {isOpen && isExpanded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
}
