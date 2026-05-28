export function TasteTag({ children }: { children: string }) {
  return (
    <span className="tb-interactive-chip inline-flex rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-medium text-[color:var(--text-secondary)]">
      {children}
    </span>
  )
}
