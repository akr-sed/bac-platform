import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'student' | 'teacher' | 'admin';

const roleStyles: Record<Role, string> = {
  student: 'bg-muted text-muted-foreground',
  teacher: 'bg-primary/10 text-primary',
  admin: 'border-primary text-primary bg-transparent',
};

interface RoleBadgeProps {
  role: Role;
  isVerified?: boolean;
  label?: string;
  className?: string;
}

export function RoleBadge({ role, isVerified, label, className }: RoleBadgeProps) {
  const displayLabel = label ?? role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Badge
      className={cn(
        'cursor-default gap-1 font-medium text-xs',
        roleStyles[role],
        className
      )}
    >
      {displayLabel}
      {role === 'teacher' && isVerified && (
        <CheckCircle className="size-3.5" aria-label="Verified" />
      )}
    </Badge>
  );
}
