import { LegalLayout } from '@/features/landing/LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidade" updatedAt="24 de novembro de 2026">
      <p>
        Esta política explica quais dados o AgroPass trata, para quê e por quanto tempo, de acordo
        com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>

      <section className="space-y-2">
        <h2>Pedidos de demonstração</h2>
        <p>
          Ao solicitar uma demonstração, coletamos nome, empresa ou propriedade, e-mail, telefone
          (opcional), perfil e o momento em que você autorizou o contato. Usamos esses dados apenas
          para responder ao pedido. A base legal é o seu consentimento, que pode ser revogado a
          qualquer momento. Os dados ficam guardados até o atendimento ou até você pedir a exclusão.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Passaportes públicos</h2>
        <p>
          Um passaporte público mostra dados do lote, a propriedade de origem, a região, o nome e o
          papel de quem registrou cada etapa, e os hashes dos documentos. Ele não publica documentos
          de identificação, contatos ou a localização exata da propriedade. Arquivos marcados como
          restritos aparecem apenas pelo hash.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Contas de usuário</h2>
        <p>
          Para quem usa a plataforma, tratamos nome, e-mail e papel na operação. As senhas são
          armazenadas apenas como hash, nunca em texto.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Armazenamento no navegador</h2>
        <p>
          O AgroPass guarda no armazenamento local do navegador a sessão de acesso e, no modo
          demonstração, os lotes de exemplo criados por você. Não usamos cookies de rastreamento nem
          de publicidade.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Seus direitos</h2>
        <ul>
          <li>Confirmar se tratamos seus dados e acessá-los.</li>
          <li>Corrigir dados incompletos ou desatualizados.</li>
          <li>Pedir a exclusão de dados tratados com base no consentimento.</li>
          <li>Revogar o consentimento.</li>
        </ul>
        <p>
          Para exercer esses direitos, envie um pedido pelo formulário de contato informando o
          e-mail usado.
        </p>
      </section>
    </LegalLayout>
  )
}
