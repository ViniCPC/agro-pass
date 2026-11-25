import { useMutation, useQuery } from '@tanstack/react-query'
import { batchesApi, type UploadDocumentInput } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo-context'
import { attachDemoDocument, listDemoDocuments, setDemoDocumentVisibility } from '@/mocks/demo-store'
import { useRefreshBatch } from './useBatchLifecycle'

export function useBatchDocuments(batchId: string | null) {
  const { isDemoMode } = useDemoMode()

  return useQuery({
    queryKey: ['batch-documents', isDemoMode ? 'demo' : 'live', batchId],
    queryFn: isDemoMode
      ? async () => listDemoDocuments(batchId ?? '')
      : () => batchesApi.listDocuments(batchId!),
    enabled: Boolean(batchId),
    staleTime: isDemoMode ? 0 : 30_000,
  })
}

// Attaching a document also adds an event to the chain, so the timeline and
// the passport are refreshed too.
export function useUploadDocument() {
  const { isDemoMode, demoRole } = useDemoMode()
  const refresh = useRefreshBatch()

  return useMutation({
    mutationFn: ({ batchId, ...input }: UploadDocumentInput & { batchId: string }) =>
      isDemoMode ? attachDemoDocument(batchId, input, demoRole) : batchesApi.uploadDocument(batchId, input),
    onSuccess: refresh,
  })
}

export function useSetDocumentVisibility() {
  const { isDemoMode } = useDemoMode()
  const refresh = useRefreshBatch()

  return useMutation({
    mutationFn: async ({ batchId, documentId, isPublic }: { batchId: string; documentId: string; isPublic: boolean }) =>
      isDemoMode
        ? setDemoDocumentVisibility(batchId, documentId, isPublic)
        : batchesApi.setDocumentVisibility(batchId, documentId, isPublic),
    onSuccess: refresh,
  })
}
