import { useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi, type GenerateQrResponse } from '@/api/batchesApi'
import { useDemoMode } from '@/contexts/demo'
import type { Batch, PaginatedResponse } from '@/types/api'
import { getPublicTraceLink } from '@/features/qr/qr.utils'

interface GenerateQrInput {
  batchId: string
  batchCode: string
}

function withQr(batch: Batch, qrCodeUrl: string): Batch {
  return { ...batch, qrCodeUrl }
}

function updateBatchInList(
  current: PaginatedResponse<Batch>,
  batchId: string,
  qrCodeUrl: string,
): PaginatedResponse<Batch> {
  return {
    ...current,
    data: current.data.map((batch) =>
      batch.id === batchId ? withQr(batch, qrCodeUrl) : batch,
    ),
  }
}

export function useGenerateQr() {
  const queryClient = useQueryClient()
  const { isDemoMode } = useDemoMode()

  return useMutation({
    mutationFn: async ({
      batchId,
      batchCode,
    }: GenerateQrInput): Promise<GenerateQrResponse> => {
      if (isDemoMode) {
        const targetUrl = getPublicTraceLink(batchCode)
        return {
          batchId,
          batchCode,
          targetUrl,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`,
        }
      }

      return batchesApi.generateQr(batchId)
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['batches', result.batchId],
        (current: Batch | undefined) =>
          current ? withQr(current, result.qrCodeUrl) : current,
      )

      queryClient.setQueriesData(
        { queryKey: ['batches'] },
        (current: unknown) => {
          if (
            !current ||
            typeof current !== 'object' ||
            !('data' in current) ||
            !Array.isArray((current as PaginatedResponse<Batch>).data)
          ) {
            return current
          }

          return updateBatchInList(
            current as PaginatedResponse<Batch>,
            result.batchId,
            result.qrCodeUrl,
          )
        },
      )

      queryClient.invalidateQueries({ queryKey: ['trace-by-code', result.batchCode] })
    },
  })
}
