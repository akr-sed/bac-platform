// TODO: Wire a PWA service worker to intercept fetch failures and redirect to /offline.
// For now, this page is reachable by manual navigation only.
// Real PWA setup (next-pwa or a custom SW) is deferred to a future wave.

import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <EmptyState
        variant="empty-error"
        title="You're offline"
        description="We'll wake up when you reconnect."
      />
      <Link href="/ar">
        <Button intent="secondary-blue">Back to home</Button>
      </Link>
    </main>
  );
}
