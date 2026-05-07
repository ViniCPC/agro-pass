import { useTraceByCode } from './useTraceByCode'

// Backward-compatible alias while we migrate usage to useTraceByCode.
export function usePublicBatch(code: string | null) {
  return useTraceByCode(code)
}
