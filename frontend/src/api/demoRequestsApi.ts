import type { DemoRequestProfile } from '@/features/landing/landing-content'
import { api } from './client'

export interface DemoRequestInput {
  name: string
  company: string
  email: string
  phone?: string
  profile: DemoRequestProfile
  consent: boolean
  // Honeypot: always empty for people.
  website?: string
}

export const demoRequestsApi = {
  create: (input: DemoRequestInput) =>
    api.post<{ id: string; receivedAt: string }>('/public/demo-requests', input),
}
