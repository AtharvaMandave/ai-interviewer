"use client";

import { useRef, useCallback, useEffect } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

/**
 * WhiteboardCanvas - Inner tldraw component, loaded via dynamic import
 * Separated to allow Next.js dynamic() with ssr: false
 */
export default function WhiteboardCanvas({ onMount, onChange }) {
    const editorRef = useRef(null);
    const debounceRef = useRef(null);

    const handleMount = useCallback((editor) => {
        editorRef.current = editor;
        onMount?.(editor);

        // Listen for changes and send snapshot
        const handleChange = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                try {
                    const snapshot = editor.store.getSnapshot();
                    onChange?.(snapshot);
                } catch (e) {
                    console.warn("[WhiteboardCanvas] Snapshot error:", e.message);
                }
            }, 500); // Debounce 500ms
        };

        // Subscribe to store changes
        const unsubscribe = editor.store.listen(handleChange, {
            source: "user",
            scope: "document",
        });

        // Cleanup
        return () => {
            unsubscribe?.();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [onMount, onChange]);

    return (
        <div className="w-full h-full whiteboard-container">
            <Tldraw
                onMount={handleMount}
                autoFocus={false}
            />
            <style jsx global>{`
                .whiteboard-container .tl-background {
                    background-color: var(--color-surface, #1a1a2e) !important;
                }
                .whiteboard-container .tlui-layout {
                    background: transparent !important;
                }
                /* Make tldraw fit dark theme better */
                .whiteboard-container {
                    --color-background: var(--color-surface, #1a1a2e);
                }
            `}</style>
        </div>
    );
}
