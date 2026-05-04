"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"

import { cn } from "@/lib/utils"

// Spec §4.3 — Radio: 24×24, checked=#0095D1, unchecked=#6D7D8B

function RadioGroup({
  className,
  ...props
}: RadioGroupPrimitive.Props & { className?: string }) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

export interface RadioProps extends RadioPrimitive.Root.Props {
  label?: string
  className?: string
}

function Radio({ className, label, value, ...props }: RadioProps) {
  const radioId = React.useId()

  return (
    <span className="inline-flex items-center gap-2">
      <RadioPrimitive.Root
        id={radioId}
        value={value}
        data-slot="radio"
        className={cn(
          // Size & shape
          "size-6 shrink-0 rounded-full border-2",
          // Unchecked: muted
          "border-[#6D7D8B]",
          // Checked: primary blue ring
          "data-checked:border-[#0095D1]",
          // States
          "transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#0095D1] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        <RadioPrimitive.Indicator className="flex items-center justify-center size-full">
          {/* Inner dot on checked */}
          <span className="size-3 rounded-full bg-[#0095D1]" />
        </RadioPrimitive.Indicator>
      </RadioPrimitive.Root>

      {label && (
        <label
          htmlFor={radioId}
          className="font-bold text-base text-[#6D7D8B] cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </span>
  )
}

export { RadioGroup, Radio }
