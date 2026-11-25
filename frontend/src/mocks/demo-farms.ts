import type { CreateFarmInput } from '@/api/farmsApi'
import type { Farm, PaginatedResponse } from '@/types/api'
import { MOCK_FARMS } from './farms.mock'

const CREATED_FARMS_KEY = 'agropass.demo.createdFarms'

// Properties registered during the demo belong to the demo cooperative, so
// the cooperative stages can be recorded on their batches too.
export const DEMO_COOPERATIVE_NAME = 'Cooperativa Regional do Cerrado'

export type CreateDemoFarmInput = Omit<CreateFarmInput, 'producerId'> & { producerName: string }

function readStored(): Farm[] {
  try {
    const raw = window.localStorage.getItem(CREATED_FARMS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Farm[]) : []
  } catch {
    return []
  }
}

// Kept for the rest of the visit even if storage is blocked.
let unsaved: Farm[] = []

function writeStored(farms: Farm[]) {
  try {
    window.localStorage.setItem(CREATED_FARMS_KEY, JSON.stringify(farms))
    unsaved = []
  } catch {
    unsaved = farms
  }
}

function createdFarms(): Farm[] {
  return unsaved.length ? unsaved : readStored()
}

// Newest first, like the API.
export function listDemoFarms(): Farm[] {
  return [...[...createdFarms()].reverse(), ...MOCK_FARMS]
}

export function demoFarmsResponse(): PaginatedResponse<Farm> {
  const data = listDemoFarms()
  return { data, pagination: { page: 1, limit: 50, totalItems: data.length, totalPages: 1 } }
}

export function findDemoFarm(id: string): Farm | null {
  return listDemoFarms().find((farm) => farm.id === id) ?? null
}

export function createDemoFarm(input: CreateDemoFarmInput): Farm {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `demo-farm-${Date.now()}`
  const carNumber = input.carNumber?.trim() || null
  if (carNumber && listDemoFarms().some((farm) => farm.carNumber === carNumber)) {
    throw new Error('Já existe uma propriedade com este número de CAR.')
  }

  const farm: Farm = {
    id,
    name: input.name.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    latitude: input.latitude,
    longitude: input.longitude,
    carNumber,
    polygonGeoJson: null,
    totalAreaHa: input.totalAreaHa ?? null,
    producerName: input.producerName.trim(),
    cooperativeName: DEMO_COOPERATIVE_NAME,
    producerId: `demo-producer-${id}`,
    createdAt: new Date().toISOString(),
  }
  writeStored([...createdFarms(), farm])
  return farm
}

export function clearDemoFarms() {
  unsaved = []
  try {
    window.localStorage.removeItem(CREATED_FARMS_KEY)
  } catch {
    // Nothing persisted.
  }
}
