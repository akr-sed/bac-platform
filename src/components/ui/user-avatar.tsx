import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Spec §4.6 — UserAvatar
// Sizes: 24 / 32 / 40 / 48 / 64 / 96 px
// Default border: 2px #BBC8D4
// Fallback gradient: linear-gradient(135deg, #0095D1, #003449) + white initials
// Online indicator: 12px green dot, bottom-end (logical)

export type AvatarSize = 24 | 32 | 40 | 48 | 64 | 96
// Keep back-compat string sizes used by existing code
export type AvatarSizeString = "sm" | "md" | "lg"

const SIZE_MAP: Record<AvatarSizeString, AvatarSize> = {
  sm: 32,
  md: 40,
  lg: 64,
}

const FONT_SIZE: Record<AvatarSize, string> = {
  24: "text-[9px]",
  32: "text-xs",
  40: "text-sm",
  48: "text-base",
  64: "text-xl",
  96: "text-3xl",
}

function getInitials(name?: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface UserAvatarProps {
  src?: string | null
  name?: string
  /** Numeric px size (24 | 32 | 40 | 48 | 64 | 96) */
  px?: AvatarSize
  /** Back-compat string size */
  size?: AvatarSizeString
  online?: boolean
  className?: string
}

export function UserAvatar({
  src,
  name,
  px,
  size = "md",
  online,
  className,
}: UserAvatarProps) {
  const resolvedPx: AvatarSize = px ?? SIZE_MAP[size]
  const sizeStyle = { width: resolvedPx, height: resolvedPx } as React.CSSProperties
  const initials = getInitials(name)

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={sizeStyle}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "User"}
          width={resolvedPx}
          height={resolvedPx}
          className="rounded-full object-cover border-2 border-[#BBC8D4]"
        />
      ) : (
        <span
          aria-label={name ?? "User"}
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-[#BBC8D4] w-full h-full",
            "font-extrabold text-white select-none",
            FONT_SIZE[resolvedPx]
          )}
          style={{
            background: "linear-gradient(135deg, #0095D1, #003449)",
          }}
        >
          {initials}
        </span>
      )}

      {online && (
        <span
          aria-label="Online"
          className={cn(
            "absolute bottom-0 end-0",
            "size-3 rounded-full bg-[#00B22A]",
            "border-2 border-white"
          )}
        />
      )}
    </span>
  )
}

export default UserAvatar
