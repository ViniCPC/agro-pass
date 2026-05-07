import { Outlet } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'

export function PublicTraceLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-page)] bg-[linear-gradient(to_bottom,rgba(13,148,136,0.05),transparent_180px)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
          <AppLogo />
          <span className="rounded-[var(--radius-badge)] border border-[var(--color-teal-100)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
            Public traceability page
          </span>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="mt-8 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-ink-subtle)]">
          AgroPass public verification interface • digital traceability certificate
        </footer>
      </div>
    </div>
  )
}
