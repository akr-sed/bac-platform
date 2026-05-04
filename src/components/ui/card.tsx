import * as React from "react"

import { cn } from "@/lib/utils"

// Spec §4.5 — Card variants
export type CardVariant = "flat" | "filled" | "elevated"

const VARIANT_CLASSES: Record<CardVariant, string> = {
  flat: "bg-white border border-[#BBC8D4] rounded-[16px] p-[var(--space-md)]",
  filled: "bg-[#F9FBFD] rounded-[16px] p-[var(--space-md)]",
  elevated:
    "bg-white rounded-[16px] shadow-[var(--shadow-lift)] hover:shadow-[var(--shadow-modal)] transition-shadow duration-[var(--motion-base)]",
}

export interface CardProps extends React.ComponentProps<"div"> {
  /** Wave 2 variant (spec §4.5) */
  variant?: CardVariant
  /** Back-compat: old size prop */
  size?: "default" | "sm"
}

function Card({
  className,
  variant = "flat",
  size = "default",
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        // Shared structure
        "group/card flex flex-col overflow-hidden text-sm text-card-foreground",
        "gap-4 data-[size=sm]:gap-3",
        // Variant styles
        VARIANT_CLASSES[variant],
        // Back-compat image rounding inherited from shadcn template
        "*:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-extrabold text-base leading-snug text-[#003449]",
        "group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-[#6D7D8B]", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-[#BBC8D4] bg-[#F9FBFD] p-4",
        "group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
