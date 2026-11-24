import { Ruler } from 'lucide-react'
import type { Farm } from '@/types/api'

function formatArea(area: number | null) {
  if (area == null) return 'Não informada'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(area) + ' ha'
}

export function FarmAreaCard({ farm }: { farm: Farm }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-teal-100)] text-[var(--color-teal-700)]">
          <Ruler size={16} />
        </div>
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Dimensão cadastrada</h2>
      </div>
      <p className="text-3xl font-semibold text-[var(--color-ink)]">{formatArea(farm.totalAreaHa)}</p>
      <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
        Área total informada no cadastro da propriedade.
      </p>
    </section>
  )
}
