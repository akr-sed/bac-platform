import Image from 'next/image';

export type OwlVariant =
  | 'empty-feed'
  | 'empty-search'
  | 'empty-saved'
  | 'empty-notifications'
  | 'empty-error'
  | 'success'
  | 'celebrate';

const VARIANT_TINT: Record<OwlVariant, { body?: string; beak?: string; iris?: string; book?: string; eyeWhite?: string }> = {
  'empty-feed': {},
  'empty-search': { iris: '#0095D1' },
  'empty-saved': { beak: '#1853F3' },
  'empty-notifications': { iris: '#6D7D8B', body: '#6D7D8B' },
  'empty-error': { beak: '#ED2D30', body: '#6D7D8B' },
  success: { beak: '#00B22A', body: '#003449' },
  celebrate: { beak: '#ED2D30', iris: '#0095D1', book: '#FFFFFF' },
};

export interface OwlIllustrationProps {
  variant: OwlVariant;
  size?: number; // px height; aspect 1:1
  className?: string;
}

export function OwlIllustration({ variant, size = 128, className }: OwlIllustrationProps) {
  const tints = VARIANT_TINT[variant];
  const style = {
    '--owl-body': tints.body,
    '--owl-beak': tints.beak,
    '--owl-eye-iris': tints.iris,
    '--owl-eye-white': tints.eyeWhite,
    '--owl-book': tints.book,
  } as React.CSSProperties;

  return (
    <span
      className={className}
      style={{ display: 'inline-block', lineHeight: 0, ...style }}
      role="img"
      aria-label={`NAJAH owl — ${variant}`}
    >
      <Image
        src="/brand/owl/base.svg"
        alt=""
        width={size}
        height={size}
        unoptimized
      />
    </span>
  );
}

export default OwlIllustration;
