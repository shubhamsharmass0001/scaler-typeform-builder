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
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Load Plus Jakarta Sans (closest freely-available Google Font to Typeform's Aperçu)
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Typeform",
    default: "Typeform — Build beautiful forms",
  },
  description:
    "A Typeform-inspired form builder. Create, share, and analyze forms with a clean, conversational UI.",
  icons: {
    icon: "/icon.svg",
  },
};

import { Providers } from "./providers";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} h-full antialiased font-sans`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var m = localStorage.getItem("theme-mode");
                  var isDark = m === "dark" || (!m && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  if (isDark) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-app text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
