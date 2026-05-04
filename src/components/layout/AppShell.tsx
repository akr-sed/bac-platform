import { VerticalNavRail } from './VerticalNavRail';

interface AppShellProps {
  children: React.ReactNode;
  /**
   * Optional panel rendered between the main content and the nav rail
   * on the logical "end" side (left in RTL/Arabic, right in LTR).
   * 320px wide on xl screens, hidden below.
   * Alias: endPanel (preferred) or leftPanel (back-compat).
   */
  endPanel?: React.ReactNode;
  /** @deprecated Use endPanel */
  leftPanel?: React.ReactNode;
}

/**
 * AppShell — wraps authenticated page content with the nav rail.
 *
 * RTL layout (Arabic default):
 *   [endPanel (left)] | [main content (center)] | [VerticalNavRail (right)]
 *
 * LTR layout:
 *   [VerticalNavRail (left)] | [main content (center)] | [endPanel (right)]
 *
 * The rail always sits on the logical `end` side (browser handles RTL flip).
 *
 * Usage:
 *   <AppShell>
 *     <MyPageContent />
 *   </AppShell>
 *
 *   <AppShell endPanel={<GamificationSidebar />}>
 *     <FeedContent />
 *   </AppShell>
 */
export function AppShell({ children, endPanel, leftPanel }: AppShellProps) {
  const panel = endPanel ?? leftPanel;
  return (
    <div className="mx-auto flex w-full max-w-[1440px] gap-5 px-4 py-5">
      {/* End panel (gamification sidebar, etc.) — logical start in DOM for RTL */}
      {panel && (
        <aside className="hidden w-[320px] shrink-0 xl:block">{panel}</aside>
      )}

      {/* Main content — grows to fill available space, capped for readability */}
      <main className="min-w-0 flex-1">{children}</main>

      {/* Nav rail — always on the logical end (right side visually in Arabic) */}
      <div className="hidden lg:block">
        <VerticalNavRail />
      </div>
    </div>
  );
}

export default AppShell;
