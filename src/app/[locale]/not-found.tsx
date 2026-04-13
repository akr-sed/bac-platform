import { Link } from '@/i18n/routing';
import { BookX, Home, ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        {/* Illustration using Lucide icons */}
        <div className="relative mb-8">
          <div className="flex size-28 items-center justify-center rounded-full bg-primary/10">
            <BookX className="size-14 text-primary" />
          </div>
          <div className="absolute -end-2 -top-2 flex size-10 items-center justify-center rounded-full bg-accent/10">
            <span className="font-heading text-lg font-bold text-accent">?</span>
          </div>
        </div>

        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          404
        </h1>
        <p className="mt-2 text-xl font-medium text-foreground">
          Page Not Found
        </p>
        <p className="mt-3 max-w-md text-muted-foreground">
          The page you are looking for does not exist or has been moved. Let us help you get back on track.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className={cn(buttonVariants(), 'cursor-pointer gap-2 rounded-xl')}
          >
            <Home className="size-4" />
            Back to Home
          </Link>
          <Link
            href="/exercises"
            className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer gap-2 rounded-xl')}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            Browse Exercises
          </Link>
        </div>
      </div>
    </main>
  );
}
