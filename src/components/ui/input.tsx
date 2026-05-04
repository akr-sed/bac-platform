import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Spec §4.2 — Input sizes
const sizeClasses = {
  md: "h-14 px-4 rounded-[16px] border-2 bg-white font-semibold text-base text-[#003449]",
  sm: "h-10 px-3 rounded-[12px] border-2 bg-white font-semibold text-sm text-[#003449]",
} as const

export interface InputProps extends Omit<React.ComponentProps<"input">, 'size'> {
  /** Visual size variant (spec §4.2) */
  inputSize?: keyof typeof sizeClasses
  /** HTML size attribute (number of chars) — preserved for back-compat */
  size?: number
}

function Input({ className, type, inputSize = "md", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "w-full min-w-0 transition-colors outline-none",
        // Border — normal state
        "border-[#BBC8D4]",
        // Placeholder
        "placeholder:text-[#BBC8D4]",
        // Focus — border turns primary blue
        "focus:border-[#0095D1]",
        // Error — aria-invalid
        "aria-invalid:border-[#ED2D30] aria-invalid:text-[#ED2D30] aria-invalid:placeholder:text-[#ED2D30]/60",
        // Disabled
        "disabled:bg-[#F9FBFD] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
        // File input resets
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#003449]",
        // Size
        sizeClasses[inputSize],
        className
      )}
      {...props}
    />
  )
}

export { Input }
