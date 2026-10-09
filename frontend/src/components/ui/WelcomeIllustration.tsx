"use client";

import React from "react";

interface WelcomeIllustrationProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Line-art SVG matching Typeform Welcome screen reference (Image 1)
 * Features:
 *  - Center Sun with geometric gear points and circular core
 *  - Soft clouds floating in upper sky
 *  - Flying birds in formation
 *  - Rolling landscape contours with evergreen pine trees
 */
export function WelcomeIllustration({
  className = "w-40 h-28",
  style,
}: WelcomeIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 140"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Upper floating clouds */}
      <path
        d="M56 25a10 10 0 0 1 18-3 9 9 0 0 1 12 7H56z"
        strokeWidth="1.4"
      />
      <path
        d="M124 50a7 7 0 0 1 13-2 6 6 0 0 1 9 5h-22z"
        strokeWidth="1.4"
      />

      {/* Flying birds in upper sky */}
      <path
        d="M130 25c1.6-1.5 3.2-1.5 4.8 0 1.6-1.5 3.2-1.5 4.8 0"
        strokeWidth="1.4"
      />
      <path
        d="M140 30c1.3-1.2 2.6-1.2 4 0 1.3-1.2 2.6-1.2 4 0"
        strokeWidth="1.4"
      />
      <path
        d="M124 34c1.2-1.2 2.4-1.2 3.6 0 1.2-1.2 2.4-1.2 3.6 0"
        strokeWidth="1.4"
      />

      {/* Center Sun with gear/geometric ray pattern matching Image 1 */}
      <circle cx="100" cy="45" r="16" strokeWidth="1.7" fill="none" />
      <path
        d="M100 21l3.5 3 4.5-1 1.5 4.5 4.5 1-0.5 4.5 4 2.5-2.5 4 3 3.5-4 2.5 1 4.5-4.5 1-1.5 4.5-4.5-1-3.5 3-3.5-3-4.5 1-1.5-4.5-4.5-1 1-4.5-4-2.5 3-3.5-2.5-4 4-2.5-0.5-4.5 4.5-1 1.5-4.5 4.5 1z"
        strokeWidth="1.5"
      />

      {/* Rolling landscape hills */}
      <path
        d="M20 110c45-20 85-15 125-2 20 6 35 7 50 1"
        strokeWidth="1.7"
      />
      <path
        d="M44 118c35-14 70-10 110 5"
        strokeWidth="1.4"
        strokeDasharray="4 3"
      />

      {/* Pine trees on left slope */}
      <path d="M48 100l-4 8h8zM48 94l-3.5 7h7zM48 108v3" strokeWidth="1.3" />
      <path d="M56 103l-3.5 7h7zM56 97l-3 6h6zM56 110v3" strokeWidth="1.3" />
      <path d="M63 106l-3 6h6zM63 112v2" strokeWidth="1.2" />
    </svg>
  );
}
