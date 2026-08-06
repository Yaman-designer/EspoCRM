interface SectionHeaderProps {
  title: string
  subtitle?: string
}

// The h2+subtitle pattern pasted near-verbatim across every top-level
// Property details section (Financial Intelligence, Asset Management,
// Location Intelligence, Address & Coordinates, Timeline). Each section
// keeps its own outer layout wrapper (some sit beside a tab bar, some
// beside a trailing badge, some stand alone) — this component owns only
// the inner title+subtitle pair, which was byte-identical (modulo
// Tailwind class order, which doesn't affect output) at every call site.
export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div>
      <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  )
}
