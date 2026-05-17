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
  // Hard-locked to light. The CSS layer defines dark tokens, but the
  // component layer still uses hardcoded light colors (`bg-white`,
  // `text-[#171C20]`, etc.) in many places, so following `prefers-color-scheme`
  // produces a half-flipped UI. Until every component honors semantic tokens,
  // we force light to keep the production deploy visually consistent.
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme="light"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
