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
        "bg-btn-primary text-primary-foreground hover:bg-btn-primary-hover active:scale-[0.99] focus-visible:ring-focus shadow-sm",
      secondary:
        "bg-surface text-primary border border-default hover:bg-surface-hover active:scale-[0.99] focus-visible:ring-focus shadow-card",
      ghost:
        "bg-transparent text-secondary hover:text-primary hover:bg-surface-hover active:scale-[0.99] focus-visible:ring-focus",
      destructive:
        "bg-error text-white hover:opacity-90 active:scale-[0.99] focus-visible:ring-red-500 shadow-sm",
      outline:
        "border border-default text-primary bg-transparent hover:bg-surface-hover focus-visible:ring-focus",
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
