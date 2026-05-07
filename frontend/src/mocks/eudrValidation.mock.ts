import type { EudrValidation, PaginatedResponse } from '@/types/api'

const SATELLITE_BEFORE = 'https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/thumbnails/placeholder-before'
const SATELLITE_AFTER  = 'https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/thumbnails/placeholder-after'

export const MOCK_LAST_VALIDATION: Record<string, EudrValidation | null> = {
  'farm-001': {
    id: 'val-001',
    status: 'COMPLIANT',
    cutoffDate: '2020-12-31T00:00:00Z',
    hectaresDeforested: 0,
    satelliteImageBeforeUrl: null,
    satelliteImageAfterUrl: null,
    ndviBefore: 0.61,
    ndviAfter: 0.74,
    evidenceHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    validatedAt: '2025-03-10T14:22:00Z',
    validUntil: '2025-09-10T14:22:00Z',
  },
  'farm-002': {
    id: 'val-002',
    status: 'NEEDS_REVIEW',
    cutoffDate: '2020-12-31T00:00:00Z',
    hectaresDeforested: 3.2,
    satelliteImageBeforeUrl: null,
    satelliteImageAfterUrl: null,
    ndviBefore: 0.78,
    ndviAfter: 0.71,
    evidenceHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    validatedAt: '2025-02-20T09:10:00Z',
    validUntil: '2025-08-20T09:10:00Z',
  },
  'farm-003': {
    id: 'val-003',
    status: 'NON_COMPLIANT',
    cutoffDate: '2020-12-31T00:00:00Z',
    hectaresDeforested: 18.7,
    satelliteImageBeforeUrl: SATELLITE_BEFORE,
    satelliteImageAfterUrl: SATELLITE_AFTER,
    ndviBefore: 0.82,
    ndviAfter: 0.54,
    evidenceHash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    validatedAt: '2024-12-15T11:05:00Z',
    validUntil: '2025-06-15T11:05:00Z',
  },
  'farm-004': null,
}

export const MOCK_VALIDATION_HISTORY: Record<string, PaginatedResponse<EudrValidation>> = {
  'farm-001': {
    data: [
      {
        id: 'val-001',
        status: 'COMPLIANT',
        cutoffDate: '2020-12-31T00:00:00Z',
        hectaresDeforested: 0,
        satelliteImageBeforeUrl: null,
        satelliteImageAfterUrl: null,
        ndviBefore: 0.61,
        ndviAfter: 0.74,
        evidenceHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        validatedAt: '2025-03-10T14:22:00Z',
        validUntil: '2025-09-10T14:22:00Z',
      },
      {
        id: 'val-001-prev',
        status: 'COMPLIANT',
        cutoffDate: '2020-12-31T00:00:00Z',
        hectaresDeforested: 0,
        satelliteImageBeforeUrl: null,
        satelliteImageAfterUrl: null,
        ndviBefore: 0.59,
        ndviAfter: 0.70,
        evidenceHash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
        validatedAt: '2024-09-01T08:00:00Z',
        validUntil: '2025-03-01T08:00:00Z',
      },
    ],
    pagination: { page: 1, limit: 20, totalItems: 2, totalPages: 1 },
  },
  'farm-002': {
    data: [
      {
        id: 'val-002',
        status: 'NEEDS_REVIEW',
        cutoffDate: '2020-12-31T00:00:00Z',
        hectaresDeforested: 3.2,
        satelliteImageBeforeUrl: null,
        satelliteImageAfterUrl: null,
        ndviBefore: 0.78,
        ndviAfter: 0.71,
        evidenceHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
        validatedAt: '2025-02-20T09:10:00Z',
        validUntil: '2025-08-20T09:10:00Z',
      },
    ],
    pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
  },
  'farm-003': {
    data: [
      {
        id: 'val-003',
        status: 'NON_COMPLIANT',
        cutoffDate: '2020-12-31T00:00:00Z',
        hectaresDeforested: 18.7,
        satelliteImageBeforeUrl: null,
        satelliteImageAfterUrl: null,
        ndviBefore: 0.82,
        ndviAfter: 0.54,
        evidenceHash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
        validatedAt: '2024-12-15T11:05:00Z',
        validUntil: '2025-06-15T11:05:00Z',
      },
    ],
    pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
  },
  'farm-004': {
    data: [],
    pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 1 },
  },
}
