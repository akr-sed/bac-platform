import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Core CVA (spec §4.1) ────────────────────────────────────────────────────
// The `intent` key holds the new Figma intents.
// The `variant` key provides back-compat for old shadcn call-sites that call
//   buttonVariants({ variant: 'ghost', size: 'sm' }) directly.
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2",
    "font-bold whitespace-nowrap select-none",
    "transition-colors duration-[var(--motion-fast)]",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-[#0095D1] focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      // ── New Wave 2 API ────────────────────────────────────────────────────
      intent: {
        "primary-blue": "bg-[#0095D1] text-white hover:bg-[#007FB3]",
        "primary-red": "bg-[#ED2D30] text-white hover:bg-[#D11F22]",
        "primary-white":
          "bg-white text-[#25313C] hover:bg-[#F9FBFD] border border-[#BBC8D4]",
        "secondary-blue":
          "border-2 border-[#0095D1] text-[#0095D1] bg-transparent hover:bg-[#D9EFF8]",
        "secondary-red":
          "border-2 border-[#ED2D30] text-[#ED2D30] bg-transparent hover:bg-[#FEEAEA]",
        "secondary-white":
          "border-2 border-white text-white bg-transparent hover:bg-white/10",
      },
      // ── Back-compat: old shadcn variant names ─────────────────────────────
      // These are used when calling buttonVariants({ variant: '...' }) directly
      // (e.g. Navbar, Landing, not-found pages).
      variant: {
        default: "bg-[#0095D1] text-white hover:bg-[#007FB3]",
        outline:
          "border-2 border-[#0095D1] text-[#0095D1] bg-transparent hover:bg-[#D9EFF8]",
        secondary:
          "bg-[#F9FBFD] text-[#25313C] hover:bg-[#E6F4FA] border border-[#BBC8D4]",
        ghost: "bg-transparent text-[#25313C] hover:bg-[#E6F4FA]",
        destructive: "bg-[#ED2D30] text-white hover:bg-[#D11F22]",
        link: "bg-transparent text-[#1853F3] underline-offset-4 hover:underline p-0 h-auto rounded-none",
      },
      // ── Size ─────────────────────────────────────────────────────────────
      size: {
        // Figma spec
        desktop:
          "h-14 px-[30px] py-[15px] rounded-[16px] font-[family-name:var(--font-sans)] text-base leading-6",
        mobile:
          "h-[33.6px] px-[9px] py-[9px] rounded-[9.6px] font-[family-name:var(--font-arabic)] font-normal text-xs leading-[1.3]",
        // Back-compat shadcn sizes
        default: "h-14 px-[30px] rounded-[16px] text-base leading-6",
        sm: "h-9 px-4 rounded-[12px] text-sm",
        lg: "h-14 px-[30px] rounded-[16px] text-base",
        xs: "h-7 px-3 rounded-[10px] text-xs",
        icon: "size-10 rounded-[12px] p-0",
        "icon-xs": "size-7 rounded-[10px] p-0",
        "icon-sm": "size-8 rounded-[12px] p-0",
        "icon-lg": "size-12 rounded-[16px] p-0",
      },
    },
    defaultVariants: {
      intent: "primary-blue",
      size: "desktop",
    },
  }
)

export interface ButtonProps extends ButtonPrimitive.Props {
  /** New Wave 2 Figma intent */
  intent?: VariantProps<typeof buttonVariants>["intent"]
  /** Back-compat: old shadcn variant — resolved to nearest intent */
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  fullWidth?: boolean
  loading?: boolean
  className?: string
}

function Button({
  className,
  intent,
  variant,
  size = "desktop",
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ intent, variant, size }),
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
