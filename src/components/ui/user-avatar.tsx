import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-16',
};

const iconSizes = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
};

export function UserAvatar({ src, name, size = 'md', className }: UserAvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'User'}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary/10',
        sizes[size],
        className
      )}
    >
      <User className={cn('text-primary', iconSizes[size])} />
    </div>
  );
}
