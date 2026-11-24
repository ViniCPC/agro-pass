import { LegalLayout } from '@/features/landing/LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Termos de Uso" updatedAt="24 de novembro de 2026">
      <p>Ao usar o AgroPass, você concorda com os termos abaixo.</p>

      <section className="space-y-2">
        <h2>O serviço</h2>
        <p>
          O AgroPass registra a trajetória de lotes agrícolas em passaportes digitais. Cada etapa
          fica ligada à anterior por um hash, e passaportes públicos podem ser consultados por QR
          Code sem cadastro.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Contas e responsabilidades</h2>
        <ul>
          <li>Cada participante responde pela veracidade das etapas e dos documentos que registra.</li>
          <li>As credenciais de acesso são pessoais e não devem ser compartilhadas.</li>
          <li>Correções são feitas por novos registros; o histórico anterior não é apagado.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>Passaportes públicos</h2>
        <p>
          Ao publicar um passaporte, a operação autoriza a exibição dos dados do lote e da origem
          descritos na Política de Privacidade. Documentos só ficam disponíveis para download quando
          marcados como públicos.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Demonstração</h2>
        <p>
          O modo demonstração usa dados fictícios e provas simuladas, identificados na tela. Lotes
          criados nele ficam apenas no navegador de quem os criou.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Blockchain</h2>
        <p>
          O registro da prova final em blockchain é opcional. A rastreabilidade e a verificação de
          integridade funcionam sem ele.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Disponibilidade e alterações</h2>
        <p>
          Buscamos manter o serviço disponível, mas ele pode passar por manutenções. Estes termos
          podem ser atualizados; a data acima indica a versão em vigor.
        </p>
      </section>
    </LegalLayout>
  )
}
