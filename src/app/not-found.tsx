import { EmptyState } from '@/components/ui/EmptyState';

// Top-level 404 — no locale context, no layout dependency.
export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#F9FBFD] font-[family-name:var(--font-sans)]">
        <main className="flex min-h-screen items-center justify-center px-4">
          <EmptyState
            variant="empty-error"
            title="الصفحة غير موجودة"
            description="الصفحة التي تبحث عنها غير موجودة."
            action={{ label: 'العودة إلى الرئيسية', href: '/ar' }}
          />
        </main>
      </body>
    </html>
  );
}
