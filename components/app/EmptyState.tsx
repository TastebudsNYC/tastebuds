import type { ReactNode } from 'react'

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode
  description: string
  title: string
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-5 py-5 shadow-[0_12px_28px_rgba(74,31,20,0.045)]">
      <p className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">{title}</p>
      <p className="tb-copy mt-2 max-w-2xl text-sm leading-6">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
