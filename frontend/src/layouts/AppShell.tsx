import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileDrawer } from '@/components/MobileDrawer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  return (
    // The soft tint behind everything is what the translucent sidebar shows through.
    <div className="flex h-screen overflow-hidden bg-[var(--color-page)] bg-[radial-gradient(48rem_32rem_at_0%_0%,rgba(13,148,136,0.13),transparent_65%),radial-gradient(40rem_28rem_at_100%_100%,rgba(176,140,80,0.10),transparent_65%)]">
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
