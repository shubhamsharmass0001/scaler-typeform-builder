"use client";

/**
 * components/ui/DropdownMenu.tsx — Click-triggered popup menu
 */

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
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
            "absolute z-30 mt-1.5 w-48 rounded-xl bg-white shadow-lg border border-[#E5E5E5] py-1 text-sm focus:outline-none animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.dividerBefore && (
                <div className="my-1 border-t border-[#F0F0F0]" />
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
                  "w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors cursor-pointer",
                  item.destructive
                    ? "text-red-600 hover:bg-red-50"
                    : "text-[#262627] hover:bg-[#F5F5F5]",
                  item.disabled && "opacity-40 pointer-events-none"
                )}
              >
                {item.icon && (
                  <span className="shrink-0 text-current">{item.icon}</span>
                )}
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
