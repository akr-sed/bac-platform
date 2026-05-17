import Image from 'next/image';

export type LogoVariant =
  | 'horizontal'
  | 'horizontal-slogan'
  | 'vertical'
  | 'mark'
  | 'mono-white'
  | 'mono-navy';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | number;

const SIZE_MAP: Record<Exclude<LogoSize, number>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 64,
};

const VARIANT_FILE: Record<LogoVariant, string> = {
  horizontal: '/brand/logo-horizontal.svg',
  'horizontal-slogan': '/brand/logo-horizontal-slogan.svg',
  vertical: '/brand/logo-vertical.svg',
  mark: '/brand/logo-mark.svg',
  'mono-white': '/brand/logo-mono-white.svg',
  'mono-navy': '/brand/logo-mono-navy.svg',
};

const VARIANT_ASPECT: Record<LogoVariant, number> = {
  horizontal: 360 / 96,
  'horizontal-slogan': 360 / 120,
  vertical: 240 / 240,
  mark: 1,
  'mono-white': 360 / 96,
  'mono-navy': 360 / 96,
};

export interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  priority?: boolean;
  className?: string;
}

export function Logo({
  variant = 'horizontal',
  size = 'md',
  priority = false,
  className,
}: LogoProps) {
  const heightPx = typeof size === 'number' ? size : SIZE_MAP[size];
  const widthPx = Math.round(heightPx * VARIANT_ASPECT[variant]);

  return (
    <Image
      src={VARIANT_FILE[variant]}
      alt="NAJAH"
      width={widthPx}
      height={heightPx}
      priority={priority}
      className={className}
    />
  );
}

export default Logo;
