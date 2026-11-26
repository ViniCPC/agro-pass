import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FINAL_HASH, makePublicBatch } from '@/test/fixtures'
import { TimelineItem } from './TimelineItem'
import { TraceBlockchainProofCard } from './TraceBlockchainProofCard'
import { TraceIntegrityCard } from './TraceIntegrityCard'

describe('TraceIntegrityCard', () => {
  it('mostra cadeia integra com o hash final', () => {
    render(<TraceIntegrityCard integrity={makePublicBatch().integrity} />)

    expect(screen.getByText('Cadeia íntegra')).toBeInTheDocument()
    expect(screen.getByText(/Os 7 eventos foram recalculados/)).toBeInTheDocument()
  })

  it('aponta o evento adulterado quando a cadeia nao confere', () => {
    render(
      <TraceIntegrityCard
        integrity={{
          valid: false,
          eventCount: 7,
          finalHash: FINAL_HASH,
          checkedAt: '2026-06-12T16:00:00Z',
          errors: [{ sequence: 3, code: 'INVALID_EVENT_HASH', message: 'Os dados nao conferem.' }],
        }}
      />,
    )

    expect(screen.getByText('Inconsistência detectada')).toBeInTheDocument()
    expect(screen.getByText(/Evento #3: Os dados nao conferem/)).toBeInTheDocument()
  })

  it('avisa quando a verificacao nao esta disponivel', () => {
    render(<TraceIntegrityCard integrity={undefined} />)
    expect(screen.getByText(/não está disponível/)).toBeInTheDocument()
  })
})

describe('TraceBlockchainProofCard', () => {
  const confirmed = (proofHash: string) =>
    makePublicBatch({
      blockchain: {
        status: 'CONFIRMED',
        network: 'devnet',
        proofHash,
        tokenAddress: 'Asset111',
        txHash: 'Tx111',
        tokenizedAt: '2026-06-12T15:05:00Z',
        explorerTxUrl: 'https://explorer.solana.com/tx/Tx111?cluster=devnet',
        explorerTokenUrl: 'https://explorer.solana.com/address/Asset111?cluster=devnet',
      },
    })

  it('confirma que o hash registrado confere com a cadeia e oferece link verificavel', () => {
    render(<TraceBlockchainProofCard data={confirmed(FINAL_HASH)} isDemo={false} />)

    expect(screen.getByText('Confere com o hash final da cadeia de eventos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Verificar transação no Solana Explorer/ })).toHaveAttribute(
      'href',
      'https://explorer.solana.com/tx/Tx111?cluster=devnet',
    )
  })

  it('alerta quando a cadeia mudou depois do registro', () => {
    render(<TraceBlockchainProofCard data={confirmed('b'.repeat(64))} isDemo={false} />)
    expect(screen.getByText(/a cadeia mudou depois do registro/)).toBeInTheDocument()
  })

  it('na demo nao oferece link para uma transacao que nao existe', () => {
    render(<TraceBlockchainProofCard data={confirmed(FINAL_HASH)} isDemo />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/Transação de demonstração/)).toBeInTheDocument()
    expect(screen.getByText(/nenhuma transação foi enviada/)).toBeInTheDocument()
    expect(screen.queryByText(/registrado como token na rede/)).not.toBeInTheDocument()
  })

  it('provider local nao oferece links nem afirma registro na Solana', () => {
    const local = confirmed(FINAL_HASH)
    local.blockchain.network = 'local'
    render(<TraceBlockchainProofCard data={local} isDemo={false} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/nenhuma transação foi enviada/)).toBeInTheDocument()
  })

  it('diferencia falha de registro em andamento', () => {
    const failed = makePublicBatch()
    failed.blockchain.status = 'FAILED'
    render(<TraceBlockchainProofCard data={failed} isDemo={false} />)

    expect(screen.getByText(/registro na blockchain falhou/)).toBeInTheDocument()
    expect(screen.queryByText(/está em andamento/)).not.toBeInTheDocument()
  })

  it('explica que a prova vem no encerramento para lotes abertos', () => {
    const open = makePublicBatch()
    open.batch.status = 'IN_TRANSIT'
    render(<TraceBlockchainProofCard data={open} isDemo={false} />)
    expect(screen.getByText(/registrada quando o lote for encerrado/)).toBeInTheDocument()
  })
})

describe('TimelineItem', () => {
  const event = {
    id: 'evt-2',
    type: 'RECEIVED' as const,
    sequence: 2,
    actorName: 'Cooperativa Agro Centro-Oeste',
    actor: { name: 'Cooperativa Agro Centro-Oeste', role: 'COOPERATIVE' as const },
    location: 'Rio Verde, GO',
    latitude: null,
    longitude: null,
    eventHash: 'c'.repeat(64),
    txHash: null,
    customStageName: 'Recebido no armazem central',
    documents: [
      {
        id: 'doc-1',
        type: 'CAR' as const,
        fileUrl: null,
        fileHash: 'd'.repeat(64),
        isPublic: false,
        createdAt: '2026-05-25T14:00:00Z',
      },
    ],
    createdAt: '2026-05-25T14:00:00Z',
  }

  it('mostra etapa, responsavel com papel, local e documento restrito', () => {
    render(<TimelineItem event={event} isLast showExplorerLinks />)

    expect(screen.getByRole('heading', { name: /#2\s*Recebido/ })).toBeInTheDocument()
    expect(screen.getByText('Cooperativa Agro Centro-Oeste')).toBeInTheDocument()
    expect(screen.getByText(/· Cooperativa/)).toBeInTheDocument()
    expect(screen.getByText('Rio Verde, GO')).toBeInTheDocument()
    expect(screen.getByText(/CAR · restrito/)).toBeInTheDocument()
  })

  it('mostra o hash curto e expande para o hash completo', async () => {
    render(<TimelineItem event={event} isLast showExplorerLinks />)
    const hash = screen.getByRole('button', { name: /cccccccccc\.\.\.cccccccc/ })

    await userEvent.click(hash)

    expect(hash).toHaveTextContent('c'.repeat(64))
    expect(hash).toHaveAttribute('aria-expanded', 'true')
  })
})
