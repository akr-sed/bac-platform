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
  // The primary nav rail uses `position: fixed` so it stays pinned in the
  // viewport regardless of how far the page scrolls. `position: sticky`
  // would be clipped by the AppShell flex container's natural height
  // once the user scrolls past it. A sibling spacer reserves the rail's
  // width inside the flex layout so main content still flows correctly.
  //
  // Horizontal positioning: max(16px, calc((100vw - 1440px) / 2 + 16px))
  // anchors the rail at the inner edge of the centered 1440px container
  // on wide screens, or flush to the 16px viewport gutter on narrow ones.
  // `inset-inline-start` flips automatically between RTL/LTR.
  //
  // End panels keep sticky+max-h: their content (achievements, quests,
  // upcoming sessions) is naturally short and looks wrong when fixed.
  const railWidth = 256;
  const panelStickyClasses =
    'sticky top-[104px] max-h-[calc(100vh-104px)] overflow-y-auto self-start';

  return (
    <>
      {/* Fixed-position rail — anchored at the inner edge of the centered
          container, full viewport height below the topbar. The <nav> inside
          VerticalNavRail already carries the "Primary navigation" aria-label,
          so this wrapper is purely positional and stays role-less. */}
      <div
        className="fixed top-[104px] z-30 hidden h-[calc(100vh-104px)] overflow-y-auto lg:block"
        style={{
          width: `${railWidth}px`,
          insetInlineStart: `max(16px, calc((100vw - 1440px) / 2 + 16px))`,
        }}
      >
        <VerticalNavRail />
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] items-start gap-6 px-4 py-5 lg:gap-10 xl:gap-12">
        {/* Spacer that reserves the rail's width so main content lines up
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
