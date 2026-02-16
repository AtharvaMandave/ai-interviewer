"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * VoiceInput - Browser-native speech-to-text using Web Speech API
 * Enhanced with Framer Motion animations and visualizer
 */
export default function VoiceInput({ onTranscript, disabled = false, className = "" }) {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            let interim = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interim += transcript;
                }
            }

            setInterimText(interim);

            if (finalTranscript) {
                onTranscript?.(finalTranscript.trim());
            }
        };

        recognition.onerror = (event) => {
            console.error("[VoiceInput] Error:", event.error);
            if (event.error === "not-allowed") {
                setIsSupported(false);
            }
            setIsListening(false);
            setInterimText("");
        };

        recognition.onend = () => {
            if (recognitionRef.current?._shouldListen) {
                try {
                    recognition.start();
                } catch (e) {
                    setIsListening(false);
                    setInterimText("");
                }
            } else {
                setIsListening(false);
                setInterimText("");
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.onend = null;
            try { recognition.stop(); } catch (e) { }
        };
    }, [onTranscript]);

    const toggleListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isListening) {
            recognition._shouldListen = false;
            try { recognition.stop(); } catch (e) { }
            setIsListening(false);
            setInterimText("");
        } else {
            recognition._shouldListen = true;
            try {
                recognition.start();
                setIsListening(true);
            } catch (e) {
                console.error("[VoiceInput] Start failed:", e);
            }
        }
    }, [isListening]);

    if (!isSupported) return null;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <motion.button
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                    transition-colors duration-300 border backdrop-blur-md shadow-lg
                    ${isListening
                        ? "bg-red-500/10 border-red-500/40 text-red-500 hover:bg-red-500/20"
                        : "bg-surface/50 border-white/10 text-muted-foreground hover:text-foreground hover:border-violet-500/30 hover:bg-white/5"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
            >
                {isListening ? (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-xl bg-red-500/10"
                        />
                        <Square className="w-4 h-4 relative z-10 fill-current" />
                        <span className="relative z-10">Stop</span>
                    </>
                ) : (
                    <>
                        <Mic className="w-4 h-4" />
                        <span>Dictate</span>
                    </>
                )}
            </motion.button>

            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-3"
                    >
                        {/* Audio Visualizer Simulation */}
                        <div className="flex items-center gap-1 h-4">
                            {[1, 2, 3, 4].map((bar) => (
                                <motion.div
                                    key={bar}
                                    className="w-1 bg-gradient-to-t from-red-500 to-orange-400 rounded-full"
                                    animate={{
                                        height: interimText ? [4, 12, 4] : [4, 8, 4]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.5,
                                        delay: bar * 0.1,
                                        ease: "easeInOut"
                                    }}
                                />
                            ))}
                        </div>

                        {interimText && (
                            <motion.span
                                key={interimText}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm font-medium text-foreground max-w-[200px] truncate"
                            >
                                {interimText}
                            </motion.span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
