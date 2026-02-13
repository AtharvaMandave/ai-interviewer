"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine classes utility
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const variants = {
    // Default: Neutral
    neutral: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",

    // Primary: Brand color
    primary: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",

    // Status (using our semantic tokens slightly adapted for badges)
    success: "border-transparent bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25",
    warning: "border-transparent bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
    danger: "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25",
    info: "border-transparent bg-blue-500/15 text-blue-500 hover:bg-blue-500/25",

    // Special
    accent: "border-transparent bg-purple-500/15 text-purple-500 hover:bg-purple-500/25",
    outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
};

export function Badge({
    children,
    variant = "neutral",
    className,
    size = "sm",
    ...props
}) {
    const classes = cn(
        "inline-flex items-center justify-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        // Sizes
        size === "xs" && "text-[10px] px-1.5 py-0.5 h-5",
        size === "sm" && "text-xs px-2.5 py-0.5 h-6",
        size === "md" && "text-sm px-3 py-1 h-8",
        // Variant
        variants[variant],
        className
    );

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
}
