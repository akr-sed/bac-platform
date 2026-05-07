'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Client-side wrapper for next-themes' <ThemeProvider>.
 *
 * Why this file exists: next-themes injects an anti-flash <script> tag
 * during render to set the html.dark class before hydration. React 19
 * warns when a <script> appears inside a server-rendered tree (its
 * "Encountered a script tag while rendering" diagnostic). Wrapping the
 * provider in a "use client" boundary scopes that script injection to
 * the client side and silences the warning, while preserving the
 * no-flash behavior on initial SSR.
 */
export function RootThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
