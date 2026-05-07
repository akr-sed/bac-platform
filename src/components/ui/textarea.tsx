import * as React from "react"

import { cn } from "@/lib/utils"

// Spec §4.2 — Textarea
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Spec values
        "flex w-full min-h-[132px] p-[15px]",
        "bg-[#F9FBFD] rounded-[7.5px]",
        "border-2 border-[#BBC8D4]",
        "font-semibold text-sm text-[#25313C]",
        "placeholder:text-[#BBC8D4]",
        // States
        "transition-colors outline-none",
        "focus:border-[#0095D1]",
        "aria-invalid:border-[#ED2D30] aria-invalid:text-[#ED2D30]",
        "disabled:bg-[#F9FBFD] disabled:opacity-60 disabled:cursor-not-allowed",
        // Field-sizing for auto-grow where supported
        "field-sizing-content",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
