import type { ReactNode } from 'react'

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode
  description?: string
  eyebrow?: string
  title: string
}) {
  return (
    <section className="border-b border-[color:var(--border-soft)] pb-5">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-4xl">
          {eyebrow ? (
            <p className="tb-label text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="tb-display mt-3 max-w-4xl text-[2.45rem] font-medium leading-[0.98] text-[color:var(--foreground)] sm:text-[3rem]">
            {title}
          </h1>
          {description ? (
            <p className="tb-copy mt-4 max-w-2xl text-base leading-7">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex flex-wrap gap-2 pt-1">{action}</div> : null}
      </div>
    </section>
  )
}
