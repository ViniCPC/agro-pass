export function CreateBatchHeader() {
  return (
    <header>
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
        Registrar lote
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
        Apenas fazendas com validação EUDR aprovada podem registrar novos lotes.
      </p>
    </header>
  )
}
