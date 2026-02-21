"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const variants = {
    neutral: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
    primary: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]",
    success: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
    warning: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
    info: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    accent: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
    outline: "bg-white text-[#374151] border-[#E5E7EB]",
};

export function Badge({
    children,
    variant = "neutral",
    className,
    size = "sm",
    ...props
}) {
    const classes = cn(
        "inline-flex items-center justify-center rounded-full border font-medium transition-colors",
        size === "xs" && "text-[10px] px-2 py-0.5 h-5",
        size === "sm" && "text-xs px-2.5 py-0.5 h-6",
        size === "md" && "text-sm px-3 py-1 h-7",
        variants[variant],
        className
    );

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
}
