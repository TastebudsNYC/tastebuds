import { TastebudsLogo } from '@/components/TastebudsLogo'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row lg:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <TastebudsLogo size="sm" theme="light" />
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
            A PLACE TO GATHER. DISCOVER SOMETHING NEW.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-8">
          {['Privacy', 'Terms', 'Support', 'Careers'].map((item) => (
            <span
              className="text-sm tracking-wide text-[color:var(--text-secondary)]"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="text-sm tracking-wide text-[color:var(--text-secondary)]">
          &copy; 2026 Tastebuds. Find the table you&apos;d actually say yes to.
        </div>
      </div>
    </footer>
  )
}
