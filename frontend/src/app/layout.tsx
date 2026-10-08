/**
 * layout.tsx — Root layout
 *
 * - Loads the Inter font from Google Fonts via next/font (zero layout shift,
 *   self-hosted automatically by Next.js).
 * - Applies the font CSS variable to <html> so Tailwind's `font-sans` picks
 *   it up via the theme extension in globals.css.
 * - Sets sensible default metadata (title, description).
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load Inter with the Latin subset only (keeps the bundle small).
// `variable` makes the font available as a CSS custom property.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Show fallback text while the font loads
});

export const metadata: Metadata = {
  title: "FormCraft — Build beautiful forms",
  description:
    "A Typeform-inspired form builder. Create, share, and analyze forms with a clean, conversational UI.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      // Attach the Inter font variable to <html> so every child can use it.
      className={`${inter.variable} h-full antialiased`}
    >
      {/*
       * `min-h-full` ensures the body fills at least the viewport height,
       * so pages with little content don't leave a white gap at the bottom.
       */}
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
