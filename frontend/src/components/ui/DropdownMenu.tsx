"use client";

/**
 * components/ui/DropdownMenu.tsx — Click-triggered popup menu
 */

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={clsx(
            "absolute z-30 mt-1.5 w-44 sm:w-48 rounded-2xl bg-surface shadow-dropdown border border-default p-1.5 text-sm focus:outline-none animate-in fade-in zoom-in-95 duration-150",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.dividerBefore && (
                <div className="my-1 border-t border-default" />
              )}
              <button
                type="button"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                className={clsx(
                  "w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-left text-sm transition-colors cursor-pointer",
                  item.destructive
                    ? "text-red-600 dark:text-red-400 hover:bg-red-500/10 font-normal"
                    : "text-primary hover:bg-surface-hover font-normal",
                  item.disabled && "opacity-40 pointer-events-none"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon && (
                    <span className="shrink-0 text-secondary">{item.icon}</span>
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.rightIcon && (
                  <span className="shrink-0 text-muted">{item.rightIcon}</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
