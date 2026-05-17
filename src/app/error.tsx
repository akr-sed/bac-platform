'use client';

// Top-level error boundary — MUST be a client component per Next.js conventions.
// Receives `error` and `reset` props from Next.js runtime.

import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: ErrorPageProps) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#F9FBFD] font-[family-name:var(--font-sans)]">
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <EmptyState
            variant="empty-error"
            title="حدث خطأ ما"
            description="حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
          />
          <Button intent="primary-blue" onClick={reset}>
            حاول مجدداً
          </Button>
        </main>
      </body>
    </html>
  );
}
