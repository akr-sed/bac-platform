'use client';

import { useEffect, useRef, useState } from 'react';
import { VerticalNavRail } from './VerticalNavRail';

/**
 * Position: fixed wrapper around VerticalNavRail.
 *
 * The rail is anchored to the inner edge of the centered 1440px container
 * via inset-inline-start, then sized to fill the viewport below the
 * topbar (calc(100vh - 104px)).
 *
 * To prevent the rail from visually overlapping the page footer on
 * scroll-to-bottom (the natural side effect of a fixed-position element
 * that doesn't respect the document flow), an IntersectionObserver
 * watches the footer. When the footer enters the viewport, the rail's
 * height is reduced so its bottom edge sits exactly at the footer's
 * top edge — the same behaviour you'd get from a properly-bounded
 * sticky element, but without the "creep behind the topbar" artifact
 * that sticky has when the container is short.
 */
export function FixedNavRail() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    function recompute() {
      const rect = footer!.getBoundingClientRect();
      // Pixels the footer extends into the viewport from the bottom edge.
      const intrusion = Math.max(0, window.innerHeight - rect.top);
      setOverlap(intrusion);
    }

    recompute();
    const observer = new IntersectionObserver(recompute, {
      threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1],
    });
    observer.observe(footer);
    window.addEventListener('scroll', recompute, { passive: true });
    window.addEventListener('resize', recompute);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="fixed top-[104px] z-30 hidden overflow-y-auto lg:block"
      style={{
        width: '256px',
        height: `calc(100vh - 104px - ${overlap}px)`,
        insetInlineStart: 'max(16px, calc((100vw - 1440px) / 2 + 16px))',
      }}
    >
      <VerticalNavRail />
    </div>
  );
}

export default FixedNavRail;
