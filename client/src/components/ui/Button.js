"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const variants = {
    // Primary: Brand color
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",

    // Secondary: Muted background
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",

    // Outline: Bordered
    outline: "bg-background border border-input hover:bg-accent hover:text-accent-foreground",

    // Ghost: Transparent hover
    ghost: "hover:bg-accent hover:text-accent-foreground",

    // Destructive: Red
    desctructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm", // Alias for destructive

    // Success
    success: "bg-success text-white hover:bg-success/90 shadow-sm",

    // Link: Underline on hover
    link: "text-primary underline-offset-4 hover:underline",
};

const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    xl: "h-14 px-8 text-lg font-semibold",
    icon: "h-10 w-10 p-2 justify-center aspect-square",
};

export function Button({
    children,
    variant = "primary",
    size = "md",
    className,
    isLoading = false,
    disabled,
    href,
    icon: Icon,
    fullWidth = false,
    onClick,
    type = "button",
    ...props
}) {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

    // Combine classes
    const classes = cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className
    );

    const content = (
        <>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && Icon && <Icon className="w-4 h-4 shrink-0" />}
            {children}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={classes} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled || isLoading}
            onClick={onClick}
            {...props}
        >
            {content}
        </button>
    );
}
