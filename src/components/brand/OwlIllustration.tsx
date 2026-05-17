export type OwlVariant =
  | 'empty-feed'
  | 'empty-search'
  | 'empty-saved'
  | 'empty-notifications'
  | 'empty-error'
  | 'success'
  | 'celebrate'
  | 'loading';

const VARIANT_TINT: Record<OwlVariant, { body?: string; beak?: string; iris?: string; book?: string; eyeWhite?: string }> = {
  'empty-feed': {},
  'empty-search': { iris: '#0095D1' },
  'empty-saved': { beak: '#1853F3' },
  'empty-notifications': { iris: '#6D7D8B', body: '#6D7D8B' },
  'empty-error': { beak: '#d14b5c', body: '#6D7D8B' },
  success: { beak: '#00B22A', body: '#013e5b' },
  celebrate: { beak: '#d14b5c', iris: '#0095D1', book: '#FFFFFF' },
  loading: { iris: '#0095D1', beak: '#0095D1' },
};

export interface OwlIllustrationProps {
  variant: OwlVariant;
  /** px height; aspect 1:1 */
  size?: number;
  className?: string;
  /** Pass true when the owl is above the fold (LCP candidate). Retained for API compat. */
  priority?: boolean;
  /** When true, applies the body bob + eye blink CSS animations (loading states). */
  animate?: boolean;
}

/**
 * NAJAH brand owl, inlined as JSX so individual paths can be targeted by class
 * for CSS keyframe animations (body bob, eye blink). Tinting via CSS variables
 * is preserved from the original asset (`public/brand/owl/base.svg`).
 */
export function OwlIllustration({
  variant,
  size = 128,
  className,
  animate = false,
}: OwlIllustrationProps) {
  const tints = VARIANT_TINT[variant];
  const style = {
    '--owl-body': tints.body,
    '--owl-beak': tints.beak,
    '--owl-eye-iris': tints.iris,
    '--owl-eye-white': tints.eyeWhite,
    '--owl-book': tints.book,
  } as React.CSSProperties;

  const bodyClass = animate ? 'owl-anim-body' : undefined;
  const eyesClass = animate ? 'owl-anim-eyes' : undefined;

  return (
    <span
      className={className}
      style={{ display: 'inline-block', lineHeight: 0, ...style }}
      role="img"
      aria-label={`NAJAH owl — ${variant}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 160"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
      >
        {/* Body + ear tufts + feet — bob together */}
        <g className={bodyClass} style={{ transformOrigin: '80px 90px' }}>
          {/* Body */}
          <path
            d="M80 14 C 50 14 30 36 30 70 V 116 C 30 138 48 152 80 152 C 112 152 130 138 130 116 V 70 C 130 36 110 14 80 14 Z"
            style={{ fill: 'var(--owl-body, #013e5b)' }}
          />
          {/* Ear tufts */}
          <path d="M36 24 L 50 6 L 54 28 Z" style={{ fill: 'var(--owl-body, #013e5b)' }} />
          <path d="M124 24 L 110 6 L 106 28 Z" style={{ fill: 'var(--owl-body, #013e5b)' }} />
          {/* Eye whites */}
          <circle cx="56" cy="56" r="18" style={{ fill: 'var(--owl-eye-white, #FFFFFF)' }} />
          <circle cx="104" cy="56" r="18" style={{ fill: 'var(--owl-eye-white, #FFFFFF)' }} />
          {/* Eye irises — these blink together via owl-anim-eyes */}
          <g className={eyesClass}>
            <circle
              className="owl-eye owl-eye-left"
              cx="56"
              cy="56"
              r="11"
              style={{ fill: 'var(--owl-eye-iris, #057a8d)', transformOrigin: '56px 56px' }}
            />
            <circle
              className="owl-eye owl-eye-right"
              cx="104"
              cy="56"
              r="11"
              style={{ fill: 'var(--owl-eye-iris, #057a8d)', transformOrigin: '104px 56px' }}
            />
          </g>
          {/* Catch-lights */}
          <circle cx="60" cy="53" r="3" style={{ fill: '#FFFFFF' }} />
          <circle cx="108" cy="53" r="3" style={{ fill: '#FFFFFF' }} />
          {/* Beak */}
          <path d="M80 70 L 86 78 L 80 86 L 74 78 Z" style={{ fill: 'var(--owl-beak, #d14b5c)' }} />
          {/* Book — left + right pages with spine */}
          <path
            d="M44 100 L 44 130 L 79 134 L 79 104 Z"
            style={{ fill: 'var(--owl-book, #FFFFFF)' }}
          />
          <path
            d="M116 100 L 116 130 L 81 134 L 81 104 Z"
            style={{ fill: 'var(--owl-book, #FFFFFF)' }}
          />
          <line
            x1="80"
            y1="104"
            x2="80"
            y2="134"
            style={{ stroke: 'var(--owl-body, #013e5b)', strokeWidth: 2 }}
          />
          {/* Feet */}
          <ellipse cx="68" cy="154" rx="8" ry="3" style={{ fill: 'var(--owl-body, #013e5b)' }} />
          <ellipse cx="92" cy="154" rx="8" ry="3" style={{ fill: 'var(--owl-body, #013e5b)' }} />
        </g>
      </svg>
    </span>
  );
}

export default OwlIllustration;
