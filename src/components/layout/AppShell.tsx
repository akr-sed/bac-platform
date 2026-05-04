import { VerticalNavRail } from './VerticalNavRail';

interface AppShellProps {
  children: React.ReactNode;
  /** Optional panel rendered between the main content and the nav rail (e.g. gamification sidebar). */
  leftPanel?: React.ReactNode;
}

/**
 * AppShell — wraps authenticated page content with the nav rail.
 *
 * RTL layout (Arabic default):
 *   [VerticalNavRail (right)] | [leftPanel (optional)] | [main content (left)]
 *
 * The shell uses flex-row-reverse (via `rtl:` variant won't work here since
 * the dir is set on <html>). Instead we use logical `flex-row` and rely on
 * the browser's logical axis in RTL mode, placing the rail at the `end` side.
 *
 * Usage:
 *   <AppShell>
 *     <MyPageContent />
 *   </AppShell>
 *
 *   <AppShell leftPanel={<GamificationPanel />}>
 *     <FeedContent />
 *   </AppShell>
 */
export function AppShell({ children, leftPanel }: AppShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-5 px-4 py-5">
      {/* Main content — grows to fill available space */}
      <main className="min-w-0 flex-1">{children}</main>

      {/* Optional panel (gamification, quick stats, etc.) */}
      {leftPanel && (
        <aside className="hidden w-[300px] shrink-0 xl:block">{leftPanel}</aside>
      )}

      {/* Nav rail — always on the end (right in LTR, left in RTL — i.e. right side visually in Arabic) */}
      <div className="hidden lg:block">
        <VerticalNavRail />
      </div>
    </div>
  );
}

export default AppShell;
