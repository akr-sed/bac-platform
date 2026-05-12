import { FixedNavRail } from './FixedNavRail';

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
  // Primary nav rail lives in FixedNavRail (client component) so it can
  // dynamically shrink when the page footer enters the viewport — avoids
  // the rail visually overlapping the footer on short pages, which a pure
  // CSS solution couldn't reconcile cleanly (sticky creeps behind the
  // topbar on short containers, fixed overlaps the footer at scroll-end).
  // A sibling spacer reserves the rail's width inside the flex layout.
  //
  // End panels keep sticky+max-h: their content (achievements, quests,
  // upcoming sessions) is short and renders fine without footer awareness.
  const railWidth = 256;
  const panelStickyClasses =
    'sticky top-[104px] max-h-[calc(100vh-104px)] overflow-y-auto self-start';

  return (
    <>
      <FixedNavRail />

      <div className="mx-auto flex w-full max-w-[1440px] items-start gap-6 px-4 py-5 lg:gap-10 xl:gap-12">
        {/* Spacer reserves the rail's width so main content lines up
            with the fixed rail rather than slipping under it. */}
        <div
          className="hidden shrink-0 lg:block"
          style={{ width: `${railWidth}px` }}
          aria-hidden="true"
        />

        {/* Main content — grows to fill available space */}
        <main className="min-w-0 flex-1">{children}</main>

        {/* End panel (gamification sidebar) — left in RTL, right in LTR */}
        {panel && (
          <aside className={`hidden w-[320px] shrink-0 xl:block ${panelStickyClasses}`}>
            {panel}
          </aside>
        )}
      </div>
    </>
  );
}

export default AppShell;
