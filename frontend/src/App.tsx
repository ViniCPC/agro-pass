import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DemoModeProvider } from '@/contexts/demo'
import { AuthProvider } from '@/contexts/auth'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { AppShell } from '@/layouts/AppShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import { PublicTraceLayout } from '@/layouts/PublicTraceLayout'

const BatchesPage = lazy(() =>
  import('@/pages/BatchesPage').then((module) => ({ default: module.BatchesPage })),
)
const BatchDetailPage = lazy(() =>
  import('@/pages/BatchDetailPage').then((module) => ({ default: module.BatchDetailPage })),
)
const CreateBatchPage = lazy(() =>
  import('@/pages/CreateBatchPage').then((module) => ({ default: module.CreateBatchPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const DemoEntryPage = lazy(() =>
  import('@/pages/DemoEntryPage').then((module) => ({ default: module.DemoEntryPage })),
)
const FarmDetailPage = lazy(() =>
  import('@/pages/FarmDetailPage').then((module) => ({ default: module.FarmDetailPage })),
)
const FarmsPage = lazy(() =>
  import('@/pages/FarmsPage').then((module) => ({ default: module.FarmsPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const TracePage = lazy(() =>
  import('@/pages/TracePage').then((module) => ({ default: module.TracePage })),
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoModeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Suspense
            fallback={
              <div className="grid min-h-screen place-items-center text-sm text-[var(--color-ink-muted)]">
                Carregando...
              </div>
            }
          >
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/demo" element={<DemoEntryPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<PublicTraceLayout />}>
                <Route path="/trace/:publicCode" element={<TracePage />} />
              </Route>

              <Route element={<AuthGuard />}>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/farms" element={<FarmsPage />} />
                  <Route path="/farms/:id" element={<FarmDetailPage />} />
                  <Route path="/batches" element={<BatchesPage />} />
                  <Route path="/batches/new" element={<CreateBatchPage />} />
                  <Route path="/batches/:id" element={<BatchDetailPage />} />
                  <Route path="/trace" element={<Navigate to="/batches" replace />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </DemoModeProvider>
    </QueryClientProvider>
  )
}
