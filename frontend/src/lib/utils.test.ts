import { describe, expect, it } from 'vitest'
import { canRecord, nextStatus } from '@/features/batches/lifecycle'
import { getPublicTraceLink, isLocalOnlyUrl } from '@/features/qr/qr.utils'
import { sha256Hex } from './sha256'

describe('sha256Hex', () => {
  it('bate com os vetores de teste do NIST', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    )
  })
})

describe('ciclo de vida', () => {
  it('segue a ordem das etapas e termina no encerramento', () => {
    expect(nextStatus('CREATED')).toBe('HARVESTED')
    expect(nextStatus('DELIVERED')).toBe('CLOSED')
    expect(nextStatus('CLOSED')).toBeNull()
    expect(nextStatus('CANCELLED')).toBeNull()
  })

  it('cada etapa tem seu papel; o admin registra todas', () => {
    expect(canRecord('COOPERATIVE', 'RECEIVED')).toBe(true)
    expect(canRecord('PRODUCER', 'RECEIVED')).toBe(false)
    expect(canRecord('ADMIN', 'IN_TRANSIT')).toBe(true)
    expect(canRecord(undefined, 'HARVESTED')).toBe(false)
  })
})

describe('QR', () => {
  it('aponta para o passaporte publico do codigo', () => {
    expect(getPublicTraceLink('AGP-2026-0001')).toBe(`${window.location.origin}/trace/AGP-2026-0001`)
  })

  it('detecta QR que so abre no proprio computador', () => {
    expect(isLocalOnlyUrl('http://localhost:5173/trace/X')).toBe(true)
    expect(isLocalOnlyUrl('http://127.0.0.1:4173/trace/X')).toBe(true)
    expect(isLocalOnlyUrl('https://vinicpc.github.io/agro-pass/trace/X')).toBe(false)
  })
})
