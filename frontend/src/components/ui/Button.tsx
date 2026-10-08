"use client";

/**
 * components/ui/Button.tsx — Reusable Button component
 *
 * Implements Typeform-like sleek button styles with subtle micro-interactions,
 * loading spinners, and variant controls.
 */

import React, { forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#262627] text-white hover:bg-[#151515] active:scale-[0.99] focus-visible:ring-[#262627] shadow-sm",
      secondary:
        "bg-white text-[#262627] border border-[#E5E5E5] hover:bg-[#F9F9F9] hover:border-[#D4D4D4] active:scale-[0.99] focus-visible:ring-neutral-400 shadow-xs",
      ghost:
        "bg-transparent text-[#525252] hover:text-[#171717] hover:bg-[#F0F0F0] active:scale-[0.99] focus-visible:ring-neutral-400",
      destructive:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:scale-[0.99] focus-visible:ring-red-500 shadow-sm",
      outline:
        "border border-[#E5E5E5] text-[#262627] bg-transparent hover:bg-[#F5F5F5] focus-visible:ring-neutral-400",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5 h-8",
      md: "text-sm px-3.5 py-2 gap-2 h-10",
      lg: "text-base px-5 py-2.5 gap-2.5 h-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
