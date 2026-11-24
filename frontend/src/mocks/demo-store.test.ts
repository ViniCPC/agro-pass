import { describe, expect, it } from 'vitest'
import { LIFECYCLE } from '@/features/batches/lifecycle'
import {
  advanceDemoBatch,
  clearDemoData,
  createDemoBatch,
  DEMO_SHOWCASE_CODE,
  findDemoBatch,
  findDemoPassport,
  setDemoBatchVisibility,
} from './demo-store'

describe('demo store', () => {
  it('o passaporte de exemplo tem a cadeia completa e a prova confere com o hash final', () => {
    const passport = findDemoPassport(DEMO_SHOWCASE_CODE)!

    expect(passport.batch.status).toBe('CLOSED')
    expect(passport.traceEvents.at(-1)?.type).toBe('CLOSED')
    expect(passport.integrity?.valid).toBe(true)
    expect(passport.blockchain.status).toBe('CONFIRMED')
    expect(passport.blockchain.proofHash).toBe(passport.integrity?.finalHash)
    // Each event points at the previous one.
    passport.traceEvents.forEach((event, index) => {
      expect(event.previousHash).toBe(index === 0 ? null : passport.traceEvents[index - 1].eventHash)
    })
  })

  it('percorre o fluxo principal: criar, registrar etapas, encerrar e publicar', () => {
    const created = createDemoBatch({
      farmId: 'farm-001',
      productType: 'COFFEE',
      quantity: 60,
      unit: 'sacas',
      harvestDate: '2026-07-01T00:00:00.000Z',
    })
    expect(created.code).toMatch(/^DEMO-2026-\d{4}$/)

    for (const status of LIFECYCLE.slice(1)) {
      advanceDemoBatch(created.id, status)
    }
    const closed = setDemoBatchVisibility(created.id, true)

    expect(closed.status).toBe('CLOSED')
    expect(closed.blockchain.status).toBe('CONFIRMED')
    expect(closed.blockchain.proofHash).toBe(closed.integrityHash)

    const passport = findDemoPassport(created.publicCode)!
    expect(passport.traceEvents.map((event) => event.type)).toEqual(LIFECYCLE)
    expect(passport.blockchain.proofHash).toBe(passport.integrity?.finalHash)
  })

  it('recusa pular etapas', () => {
    expect(() => advanceDemoBatch('demo-batch-0004', 'DELIVERED')).toThrow(/não permitida/)
  })

  it('lote privado nao tem passaporte publico ate ser publicado', () => {
    const privateBatch = findDemoBatch('demo-batch-0004')!
    expect(privateBatch.isPublic).toBe(false)
    expect(findDemoPassport(privateBatch.publicCode)).toBeNull()

    setDemoBatchVisibility(privateBatch.id, true)
    expect(findDemoPassport(privateBatch.publicCode)).not.toBeNull()
  })

  it('sair da demo descarta lotes e etapas criados', () => {
    advanceDemoBatch('demo-batch-0004', 'HARVESTED')
    clearDemoData()
    expect(findDemoBatch('demo-batch-0004')?.status).toBe('CREATED')
  })
})
