"use client";

/**
 * app/providers.tsx — Global client-side context providers
 *
 * Wraps the app in:
 *   - TanStack React Query QueryClientProvider
 *   - Sonner Toaster for toast notifications
 */

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={resolvedTheme}
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        style: {
          borderRadius: "12px",
          fontSize: "14px",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Ensure query client is only created once per client lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
