export function TraceTrustFooter() {
  return (
    <footer className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-page)] p-4 text-xs leading-6 text-[var(--color-ink-subtle)] shadow-[var(--shadow-card)]">
      Cada evento guarda o hash do anterior: alterar ou apagar um registro quebra a cadeia e aparece
      na verificação de integridade. Para proteger produtores e equipes, esta página não publica
      documentos pessoais, contatos nem a localização exata da propriedade.
    </footer>
  )
}
