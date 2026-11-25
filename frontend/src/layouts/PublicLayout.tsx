import { Outlet } from 'react-router-dom'
import { HomeLogoLink } from '@/components/HomeLogoLink'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-page)]">
      <header className="h-14 flex items-center px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <HomeLogoLink />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
    </div>
  )
}
