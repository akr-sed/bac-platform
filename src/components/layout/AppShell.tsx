import { VerticalNavRail } from './VerticalNavRail';

interface AppShellProps {
  children: React.ReactNode;
  /**
   * Optional panel rendered between the main content and the nav rail
   * on the logical "end" side (left in RTL/Arabic, right in LTR).
   * 320px wide on xl screens, hidden below.
   */
  endPanel?: React.ReactNode;
  /** @deprecated Use endPanel */
  leftPanel?: React.ReactNode;
}

/**
 * Authenticated page shell.
 *
 * Layout (logical, flips for RTL):
 *
 *   [VerticalNavRail (start) | main content | endPanel (end)]
 *
 * The rail uses `position: sticky` and `align-self: stretch`, so it always
 * fills the vertical space of this flex row. The outer flex container takes
 * `flex-1` inside the parent (locale layout's `<main>`, which is itself
 * `flex flex-col flex-1`). As a result:
 *
 *   - On short content pages, the row stretches to fill the viewport area
 *     between the navbar and footer — the rail is exactly that tall, with
 *     Settings sitting just above the footer. No overlap.
 *
 *   - On long content pages, the row grows with the content. The rail's
 *     height is capped at `calc(100vh - 104px)` via `max-h-...` so it stays
 *     a clean viewport-sized column with Settings pinned at its bottom.
 *     Sticky keeps the rail at `top: 104px` while scrolling, and when the
 *     user scrolls into the footer area the rail rides up with the row's
 *     bottom — never overlapping the footer.
 */
export function AppShell({ children, endPanel, leftPanel }: AppShellProps) {
  const panel = endPanel ?? leftPanel;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-5 sm:px-6 lg:gap-10 lg:px-8 xl:gap-12">
      {/* Primary nav rail — first in DOM = logical start (right in RTL, left in LTR).
          self-stretch fills the row's height; max-h caps it to the viewport-below-topbar
          so on very tall content pages it doesn't overflow off-screen.
          NOTE: `top-[104px]` and `calc(100vh-104px)` are coupled to Navbar's `lg`
          height (84px topbar + 20px breathing room). This rail is `lg:block` only,
          and at `lg+` the navbar stays 84px, so the offset is correct there. If
          Navbar's `lg` height changes, update these references in lock-step. */}
      <div className="hidden shrink-0 self-stretch lg:block">
        <div className="sticky top-[104px] h-[calc(100vh-104px)] max-h-[calc(100vh-104px)] w-[256px] overflow-y-auto">
          <VerticalNavRail />
        </div>
      </div>

      {/* Main content — grows to fill remaining space */}
      <main className="min-w-0 flex-1">{children}</main>

      {/* End panel — last in DOM = logical end (left in RTL, right in LTR).
          Same sticky treatment but with max-h only (gamification cards are short
          and shouldn't be forced to fill empty space). Same 104px coupling to
          Navbar's `lg` height applies — keep these in sync. */}
      {panel && (
        <aside className="hidden w-[320px] shrink-0 self-start xl:block">
          <div className="sticky top-[104px] max-h-[calc(100vh-104px)] overflow-y-auto">
            {panel}
          </div>
        </aside>
      )}
    </div>
  );
}

export default AppShell;
