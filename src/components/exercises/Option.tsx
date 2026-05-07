import * as React from "react"
import { cn } from "@/lib/utils"

// Spec §4.4 — MCQ Option

export type OptionStatus =
  | "default"
  | "hover"
  | "selected"
  | "correct"
  | "wrong"
  | "multiple-choice"

export type OptionLocale = "latin" | "arabic"

export interface OptionProps {
  status?: OptionStatus
  locale?: OptionLocale
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

// Spec: status → background/text colour
const STATUS_CLASSES: Record<OptionStatus, string> = {
  default: "bg-[#F9FBFD] text-[#0A2161] border-[#6D7D8B]",
  hover: "bg-[#D9EFF8] text-[#0A2161] border-[#0095D1]",
  selected: "bg-[#0095D1] text-white border-[#0095D1]",
  correct: "bg-[#00B22A] text-white border-[#00B22A]",
  wrong: "bg-[#ED2D30] text-white border-[#ED2D30]",
  "multiple-choice": "bg-[#F9FBFD] text-[#0A2161] border-[#6D7D8B]",
}

// Icon for each status (radio/checkbox circles)
function OptionIcon({ status }: { status: OptionStatus }) {
  const isMultiple = status === "multiple-choice"
  const isActive = ["selected", "correct", "wrong"].includes(status)

  if (isMultiple) {
    // Checkbox style
    return (
      <span
        aria-hidden
        className={cn(
          "size-6 shrink-0 rounded-[6px] border-2 flex items-center justify-center",
          "border-[#6D7D8B]"
        )}
      />
    )
  }

  // Radio style
  return (
    <span
      aria-hidden
      className={cn(
        "size-6 shrink-0 rounded-full border-2 flex items-center justify-center",
        isActive
          ? "border-white"
          : "border-[#6D7D8B]"
      )}
    >
      {isActive && (
        <span className="size-3 rounded-full bg-white" />
      )}
    </span>
  )
}

export function Option({
  status = "default",
  locale = "latin",
  children,
  onClick,
  disabled,
  className,
}: OptionProps) {
  const isArabic = locale === "arabic"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Layout — spec §4.4
        "h-14 w-full rounded-[16px] border p-[15px]",
        "flex items-center gap-[15px]",
        "cursor-pointer",
        "transition-colors duration-[var(--motion-base)]",
        "outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#0095D1] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // RTL/Arabic: reverse icon and text
        isArabic && "flex-row-reverse text-end",
        // Status colours
        STATUS_CLASSES[status],
        className
      )}
    >
      <OptionIcon status={status} />
      <span className={cn("flex-1 font-semibold text-sm", isArabic && "font-[family-name:var(--font-arabic)]")}>
        {children}
      </span>
    </button>
  )
}

export default Option
