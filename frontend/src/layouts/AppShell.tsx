import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { MobileDrawer } from '@/components/MobileDrawer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-page)]">
      <MobileDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        desktopContent={<Sidebar />}
        drawerContent={<Sidebar mobile onNavigate={() => setIsDrawerOpen(false)} />}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onOpenMenu={() => setIsDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
