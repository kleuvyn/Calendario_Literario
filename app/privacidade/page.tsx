import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-slate-900 font-serif">
      <main className="mx-auto max-w-4xl p-6 sm:p-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <h1 className="text-4xl font-black mb-4">Política de Privacidade</h1>
          <p className="text-sm leading-7 text-slate-600 mb-6">
            No Calendário Literário, sua privacidade e seus direitos são nossa prioridade. Aqui explicamos quais dados coletamos, por que coletamos e como você pode exercer seus direitos de acordo com a LGPD.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">1. Quais dados coletamos</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm leading-7">
              <li>Nome, e-mail e imagem de perfil usados para login e identificação.</li>
              <li>Dados de leitura como títulos, capa, status, datas e progresso.</li>
              <li>Preferências locais como tema e consentimento de cookies.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">2. Para que usamos seus dados</h2>
            <p className="text-slate-600 text-sm leading-7">
              Seus dados são usados para salvar suas leituras, organizar seu calendário literário e manter suas preferências. Não vendemos ou compartilhamos suas informações com terceiros para fins comerciais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">3. Consentimento de análise</h2>
            <p className="text-slate-600 text-sm leading-7 mb-3">
              O site usa análise anônima somente se você aceitar no banner de privacidade. Se recusar, nenhum rastreamento de uso será ativado.
            </p>
            <p className="text-slate-600 text-sm leading-7">
              O consentimento é armazenado localmente no seu navegador e pode ser revogado a qualquer momento apagando o armazenamento local ou usando as configurações do navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">4. Seus direitos</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm leading-7">
              <li>Direito de acesso e correção dos seus dados pessoais.</li>
              <li>Direito de exclusão: você pode apagar sua conta e todos os dados associados.</li>
              <li>Direito de portabilidade e revogação do consentimento.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">5. Como apagar seus dados</h2>
            <p className="text-slate-600 text-sm leading-7 mb-3">
              Para apagar seus dados, acesse seu perfil e escolha a opção <strong>Excluir Conta Permanentemente</strong>. Isso removerá seu cadastro, leituras e registros do aplicativo.
            </p>
            <p className="text-slate-600 text-sm leading-7">
              Se preferir, você também pode entrar em contato pelo e-mail de suporte disponível no app para solicitar a exclusão manualmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Contato</h2>
            <p className="text-slate-600 text-sm leading-7 mb-4">
              Tem dúvidas sobre privacidade ou quer exercer seus direitos? Acesse o suporte no app ou use a opção de exclusão de conta.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Voltar ao app
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}
