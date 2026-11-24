import { useQuery } from '@tanstack/react-query'
import { renderQrDataUrl } from '@/features/qr/qr-render'

// QR codes are deterministic, so each (text, width) pair renders once.
export function useQrDataUrl(text: string | null, width: number) {
  return useQuery({
    queryKey: ['qr-image', text, width],
    queryFn: () => renderQrDataUrl(text!, width),
    enabled: Boolean(text),
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  })
}
