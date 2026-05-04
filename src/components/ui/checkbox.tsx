"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Spec §4.3 — Checkbox: 24×24, checked=#0095D1, unchecked=#6D7D8B

export interface CheckboxProps extends CheckboxPrimitive.Root.Props {
  label?: string
  className?: string
}

function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id ?? generatedId

  return (
    <span className="inline-flex items-center gap-2">
      <CheckboxPrimitive.Root
        id={checkboxId}
        data-slot="checkbox"
        className={cn(
          // Size & shape
          "size-6 shrink-0 rounded-[6px] border-2",
          // Unchecked: muted border/text
          "border-[#6D7D8B] text-[#6D7D8B]",
          // Checked: primary blue
          "data-checked:bg-[#0095D1] data-checked:border-[#0095D1] data-checked:text-white",
          // States
          "transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#0095D1] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <CheckIcon className="size-3.5 text-white" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {label && (
        <label
          htmlFor={checkboxId}
          className="font-bold text-base text-[#6D7D8B] cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </span>
  )
}

export { Checkbox }
