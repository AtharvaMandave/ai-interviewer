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
    const baseStyles =
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-200";

    const hoverStyles = hover
        ? "hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
        : "";

    const Component = animate ? motion.div : 'div';

    const animationProps = animate ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: "easeOut" }
    } : {};

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
    return <div className={cn("flex flex-col space-y-1.5 p-6 pb-0", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
    return <h3 className={cn("font-semibold leading-none tracking-tight text-foreground", className)}>{children}</h3>;
}

export function CardDescription({ children, className }) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({ children, className }) {
    return <div className={cn("p-6 pt-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
    return (
        <div
            className={cn(
                "flex items-center p-6 pt-0 mt-4 border-t border-border bg-muted/50",
                className
            )}
        >
            {children}
        </div>
    );
}
