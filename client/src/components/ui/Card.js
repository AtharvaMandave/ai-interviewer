"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Card({
    children,
    className,
    hover = false,
    animate = true,
    ...props
}) {
    // Core card — white, subtle shadow, clean border, rounded 16px
    const baseStyles =
        "bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200";

    const hoverStyles = hover
        ? "hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-[#D1D5DB] cursor-pointer"
        : "";

    const Component = animate ? motion.div : "div";

    const animationProps = animate
        ? {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, ease: "easeOut" },
        }
        : {};

    return (
        <Component
            {...animationProps}
            className={cn(baseStyles, hoverStyles, className)}
            {...props}
        >
            {children}
        </Component>
    );
}

export function CardHeader({ children, className }) {
    return (
        <div className={cn("flex flex-col space-y-1.5 p-6 pb-0", className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className }) {
    return (
        <h3
            className={cn(
                "font-semibold leading-tight tracking-tight text-[#111827]",
                className
            )}
        >
            {children}
        </h3>
    );
}

export function CardDescription({ children, className }) {
    return (
        <p className={cn("text-sm text-[#6B7280] leading-relaxed", className)}>
            {children}
        </p>
    );
}

export function CardContent({ children, className }) {
    return <div className={cn("p-6 pt-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
    return (
        <div
            className={cn(
                "flex items-center p-6 pt-0 mt-4 border-t border-[#E5E7EB]",
                className
            )}
        >
            {children}
        </div>
    );
}
