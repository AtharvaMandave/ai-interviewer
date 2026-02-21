"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const variants = {
    // Primary — Solid brand color, white text
    primary:
        "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-sm active:scale-[0.98]",

    // Secondary — Light gray background, dark text
    secondary:
        "bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] hover:bg-[#E5E7EB] active:scale-[0.98]",

    // Outline — Bordered, transparent bg
    outline:
        "bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] active:scale-[0.98]",

    // Ghost — Transparent, subtle hover
    ghost:
        "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]",

    // Destructive
    desctructive:
        "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm active:scale-[0.98]",
    danger:
        "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm active:scale-[0.98]",

    // Success
    success:
        "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm active:scale-[0.98]",

    // Link
    link: "text-[#2563EB] underline-offset-4 hover:underline p-0 h-auto",
};

const sizes = {
    sm: "h-8 px-3 text-xs rounded-[8px]",
    md: "h-10 px-4 text-sm rounded-[10px]",
    lg: "h-11 px-6 text-sm rounded-[10px]",
    xl: "h-12 px-8 text-base font-semibold rounded-[12px]",
    icon: "h-10 w-10 p-2 justify-center aspect-square rounded-[10px]",
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
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer";

    const classes = cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        // hover lift only for non-ghost/link
        !["ghost", "link"].includes(variant) ? "hover:-translate-y-px" : "",
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
