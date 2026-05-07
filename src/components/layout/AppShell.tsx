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
 *   [VerticalNavRail (right)] | [main content (center)] | [endPanel (left)]
 *
 * LTR layout:
 *   [VerticalNavRail (left)] | [main content (center)] | [endPanel (right)]
 *
 * The rail always sits on the logical `start` side (browser handles RTL flip).
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
  // TopAppBar is h-[84px] sticky; sidebars stick directly underneath it.
  // Each sidebar gets its own scroll container so it never pushes the page.
  const stickyClasses =
    'sticky top-[84px] max-h-[calc(100vh-84px)] overflow-y-auto self-start';

  return (
    <div className="mx-auto flex w-full max-w-[1440px] items-start gap-6 px-4 py-5 lg:gap-10 xl:gap-12">
      {/* Nav rail — first in DOM = logical start (right in RTL, left in LTR) */}
      <div className={`hidden lg:block ${stickyClasses}`}>
        <VerticalNavRail />
      </div>

      {/* Main content — grows to fill available space, capped for readability */}
      <main className="min-w-0 flex-1">{children}</main>

      {/* End panel (gamification sidebar) — last in DOM = logical end (left in RTL, right in LTR) */}
      {panel && (
        <aside className={`hidden w-[320px] shrink-0 xl:block ${stickyClasses}`}>
          {panel}
        </aside>
      )}
    </div>
  );
}

export default AppShell;
