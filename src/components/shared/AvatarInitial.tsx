interface AvatarInitialProps {
  name: string
  /**
   * 'md' = Command Hub's "Assigned Agent" circle (size-9, ring-1).
   * 'lg' = ContactsCard's per-contact circle (h-10 w-10, ring-2) — a real,
   * verified pixel difference (different gradient stops, ring weight, text
   * size) between the two original implementations, not invented; both are
   * preserved exactly rather than forced to share one size.
   */
  size?: 'md' | 'lg'
}

// Gradient-ring circle carrying a name's first letter.
export function AvatarInitial({ name, size = 'md' }: AvatarInitialProps) {
  const initial = name.charAt(0).toUpperCase()

  if (size === 'lg') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/28 to-primary/10 ring-2 ring-primary/14">
        <span className="text-sm font-black text-primary">{initial}</span>
      </div>
    )
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-primary/12 ring-1 ring-border/25">
      <span className="text-[13px] font-black text-primary">{initial}</span>
    </div>
  )
}
