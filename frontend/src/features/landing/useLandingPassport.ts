import { useMemo } from 'react'
import { DEMO_LANDING_CODE, findDemoPassport } from '@/mocks/demo-store'

// The batch the landing page shows: bundled demo data with a real SHA-256
// chain, so the page displays the actual product, not an illustration.
export function useLandingPassport() {
  return useMemo(() => findDemoPassport(DEMO_LANDING_CODE), [])
}
