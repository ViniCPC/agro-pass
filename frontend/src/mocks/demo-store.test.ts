import { afterEach, describe, expect, it } from 'vitest'
import { readBytes } from '@/features/batches/document-upload'
import { LIFECYCLE } from '@/features/batches/lifecycle'
import { sha256HexBytes } from '@/lib/sha256'
import { createDemoFarm, listDemoFarms } from './demo-farms'
import {
  advanceDemoBatch,
  attachDemoDocument,
  cancelDemoBatch,
  clearDemoData,
  correctDemoEvent,
  createDemoBatch,
  DEMO_SHOWCASE_CODE,
  findDemoBatch,
  findDemoBatchEvents,
  findDemoPassport,
  listDemoDocuments,
  setDemoBatchVisibility,
  setDemoDocumentVisibility,
} from './demo-store'

afterEach(() => clearDemoData())

function pdf(name: string, body = name) {
  return new File([`%PDF-1.4
${body}
%%EOF`], name, { type: 'application/pdf' })
}

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

  it('comeca do zero: propriedade nova, lote nela e etapa com informacoes', () => {
    const farm = createDemoFarm({
      name: 'Sítio Alto',
      city: 'Franca',
      state: 'sp',
      latitude: -20.53,
      longitude: -47.4,
      producerName: 'Ana Teste',
    })
    expect(farm.state).toBe('SP')
    expect(listDemoFarms()[0].id).toBe(farm.id)

    const batch = createDemoBatch({ farmId: farm.id, productType: 'COFFEE', quantity: 40, unit: 'sacas' })
    expect(batch.harvestDate).toBeNull()
    // Private until published, like the API.
    expect(batch.isPublic).toBe(false)
    expect(findDemoPassport(batch.publicCode)).toBeNull()

    advanceDemoBatch(batch.id, 'HARVESTED', { location: ' Talhão 2 ', notes: 'Colheita manual' }, 'PRODUCER')
    const harvested = findDemoBatchEvents(batch.id).at(-1)!
    expect(harvested).toMatchObject({ location: 'Talhão 2', notes: 'Colheita manual', actorName: 'Ana Teste' })
    expect(harvested.previousHash).toBe(findDemoBatchEvents(batch.id)[0].eventHash)
  })

  it('cada etapa so pode ser registrada pelo papel responsavel', () => {
    expect(() => advanceDemoBatch('demo-batch-0004', 'HARVESTED', {}, 'COOPERATIVE')).toThrow(/não registra/)
    expect(() => createDemoBatch({ farmId: 'farm-001', productType: 'SOY', quantity: 1, unit: 't' }, 'OPERATOR')).toThrow()
    // The admin can record any stage.
    expect(advanceDemoBatch('demo-batch-0004', 'HARVESTED', {}, 'ADMIN').status).toBe('HARVESTED')
  })

  it('anexa documento com o hash real do arquivo e recusa o mesmo arquivo de novo', async () => {
    const file = pdf('nota.pdf', 'nota fiscal 123')
    const document = await attachDemoDocument('demo-batch-0004', { file, type: 'INVOICE', isPublic: false })

    const bytes = await readBytes(file)
    expect(document.fileHash).toBe(sha256HexBytes(bytes))
    expect(listDemoDocuments('demo-batch-0004').map((item) => item.id)).toContain(document.id)

    const attached = findDemoBatchEvents('demo-batch-0004').at(-1)!
    expect(attached.type).toBe('DOCUMENT_ATTACHED')
    expect(attached.documents[0].fileHash).toBe(document.fileHash)

    await expect(
      attachDemoDocument('demo-batch-0004', { file: pdf('copia.pdf', 'nota fiscal 123'), type: 'INVOICE', isPublic: true }),
    ).rejects.toThrow(/já foi enviado/)
    await expect(
      attachDemoDocument('demo-batch-0004', { file: pdf('x.pdf'), type: 'OTHER', isPublic: true }, 'OPERATOR'),
    ).rejects.toThrow(/cooperativa/)
  })

  it('documento privado aparece no passaporte so pelo hash, e a visibilidade muda sem quebrar a cadeia', async () => {
    const document = await attachDemoDocument('demo-batch-0004', { file: pdf('laudo.pdf'), type: 'OTHER', isPublic: false })
    setDemoBatchVisibility('demo-batch-0004', true)
    const before = findDemoBatch('demo-batch-0004')!.integrityHash

    const restricted = findDemoPassport(findDemoBatch('demo-batch-0004')!.publicCode)!
    const shown = restricted.documents.find((item) => item.id === document.id)!
    expect(shown).toMatchObject({ isPublic: false, originalName: null, fileUrl: null, fileHash: document.fileHash })

    setDemoDocumentVisibility('demo-batch-0004', document.id, true)
    const published = findDemoPassport(findDemoBatch('demo-batch-0004')!.publicCode)!
    expect(published.documents.find((item) => item.id === document.id)?.originalName).toBe('laudo.pdf')
    expect(findDemoBatch('demo-batch-0004')!.integrityHash).toBe(before)
  })

  it('correcao e um novo evento que aponta o original', () => {
    const [created] = findDemoBatchEvents('demo-batch-0004')
    const correction = correctDemoEvent('demo-batch-0004', {
      correctedEventId: created.id,
      notes: 'Quantidade certa: 4400 kg',
    })
    expect(correction).toMatchObject({ type: 'CORRECTION', correctedEventId: created.id })
    expect(findDemoBatchEvents('demo-batch-0004')[0]).toEqual(created)
    expect(() => correctDemoEvent('demo-batch-0004', { correctedEventId: 'outro', notes: 'x'.repeat(10) })).toThrow()
    expect(() => correctDemoEvent('demo-batch-0004', { correctedEventId: created.id, notes: 'ok ok' }, 'PRODUCER')).toThrow()
  })

  it('cancelar registra o motivo e encerra as alteracoes', async () => {
    const cancelled = cancelDemoBatch('demo-batch-0004', 'Lote duplicado')
    expect(cancelled.status).toBe('CANCELLED')
    expect(findDemoBatchEvents('demo-batch-0004').at(-1)).toMatchObject({ type: 'CANCELLED', notes: 'Lote duplicado' })
    expect(() => advanceDemoBatch('demo-batch-0004', 'HARVESTED')).toThrow()
    await expect(
      attachDemoDocument('demo-batch-0004', { file: pdf('tarde.pdf'), type: 'OTHER', isPublic: false }),
    ).rejects.toThrow(/não recebe/)
  })

  it('sair da demo descarta lotes e etapas criados', () => {
    advanceDemoBatch('demo-batch-0004', 'HARVESTED')
    const farm = createDemoFarm({ name: 'Temporária', city: 'X', state: 'MG', latitude: 0, longitude: 0, producerName: 'P' })
    clearDemoData()
    expect(findDemoBatch('demo-batch-0004')?.status).toBe('CREATED')
    expect(listDemoFarms().some((item) => item.id === farm.id)).toBe(false)
  })
})
