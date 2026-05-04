import * as React from "react"
import { OwlIllustration, type OwlVariant } from "@/components/brand/OwlIllustration"
import { Button } from "@/components/ui/button"

// Spec §4.7 (W2-T7) — EmptyState

export interface EmptyStateProps {
  variant: OwlVariant
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({ variant, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-[var(--space-2xl)]">
      <OwlIllustration variant={variant} size={128} className="mb-[var(--space-md)]" />
      <h3 className="font-extrabold text-2xl text-[#003449] mb-2">{title}</h3>
      {description && (
        <p className="text-base text-[#6D7D8B] max-w-md mb-[var(--space-md)]">{description}</p>
      )}
      {action &&
        (action.href ? (
          <a href={action.href}>
            <Button intent="primary-blue">{action.label}</Button>
          </a>
        ) : (
          <Button intent="primary-blue" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}

export default EmptyState
