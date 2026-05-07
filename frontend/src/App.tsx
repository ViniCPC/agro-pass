import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DemoModeProvider } from '@/contexts/demo'
import { DemoGuard } from '@/features/demo/DemoGuard'
import { AppShell } from '@/layouts/AppShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import { PublicTraceLayout } from '@/layouts/PublicTraceLayout'
import { BatchesPage } from '@/pages/BatchesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DemoEntryPage } from '@/pages/DemoEntryPage'
import { FarmDetailPage } from '@/pages/FarmDetailPage'
import { FarmsPage } from '@/pages/FarmsPage'
import { TracePage } from '@/pages/TracePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoModeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/demo" element={<DemoEntryPage />} />
            </Route>

            <Route element={<PublicTraceLayout />}>
              <Route path="/trace/:code" element={<TracePage />} />
            </Route>

            <Route element={<DemoGuard />}>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/farms" element={<FarmsPage />} />
                <Route path="/farms/:id" element={<FarmDetailPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/trace" element={<Navigate to="/batches" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </DemoModeProvider>
    </QueryClientProvider>
  )
}
