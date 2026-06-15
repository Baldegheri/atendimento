"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { EditorResposta, type AcaoEnvio } from "./editor-resposta"

type Destinatario = {
  id: string
  email: string
  nome: string | null
  tipo: "PARA" | "CC" | "CCO"
}

type Mensagem = {
  id: string
  deEmail: string
  deNome: string | null
  conteudoHtml: string
  direcao: "ENTRADA" | "SAIDA"
  enviadoEm: string
  destinatarios: Destinatario[]
}

type ChamadoCompleto = {
  id: string
  assunto: string
  threadId: string | null
  prazoSla: string | null
  resolvidoEm: string | null
  criadoEm: string
  coluna: { nome: string; cor: string }
  prioridade: { nome: string; cor: string } | null
  categoria: { id: string; nome: string } | null
  responsavel: { id: string; nome: string; email: string; imagem: string | null } | null
  participantes: {
    tipo: "PARA" | "CC" | "CCO"
    cliente: { id: string; email: string; nome: string | null }
  }[]
  mensagens: Mensagem[]
}

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function iniciais(texto: string) {
  return texto
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

function separarConteudo(html: string): { corpo: string; historico: string | null } {
  const markerIdx = html.indexOf("border-top:1px solid #e5e7eb")
  if (markerIdx > 0) {
    const divStart = html.lastIndexOf("<div", markerIdx)
    if (divStart > 0) return { corpo: html.slice(0, divStart).trim(), historico: html.slice(divStart) }
  }
  const gmailIdx = html.indexOf("gmail_quote")
  if (gmailIdx > 0) {
    const divStart = html.lastIndexOf("<div", gmailIdx)
    if (divStart > 0) return { corpo: html.slice(0, divStart).trim(), historico: html.slice(divStart) }
  }
  const bqIdx = html.indexOf("<blockquote")
  if (bqIdx > 0) return { corpo: html.slice(0, bqIdx).trim(), historico: html.slice(bqIdx) }
  return { corpo: html, historico: null }
}

// Normaliza cores inline do HTML do e-mail para funcionar em modo escuro:
// texto preto/escuro → herda a cor do container; fundos brancos → transparente
function sanitizarHtml(html: string): string {
  return html
    .replace(
      /\bcolor\s*:\s*(?:#(?:000|000000|111|111111|222|222222|333|333333|1a1a1a|0d0d0d)\b|black\b)/gi,
      "color:inherit",
    )
    .replace(
      /\bbackground(?:-color)?\s*:\s*(?:white\b|#(?:fff|ffffff)\b)/gi,
      "background-color:transparent",
    )
}

function textoSimples(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function ItemMensagem({ msg }: { msg: Mensagem }) {
  const [expandida, setExpandida] = useState(true)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const saida = msg.direcao === "SAIDA"
  const nomeExibido = msg.deNome || msg.deEmail
  const { corpo, historico } = separarConteudo(msg.conteudoHtml)
  const preview = textoSimples(corpo).slice(0, 100)

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-shadow hover:shadow-sm ${
        saida
          ? "border-blue-200/60 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/20"
          : "border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900"
      }`}
    >
      {/* Cabeçalho clicável */}
      <button
        type="button"
        onClick={() => setExpandida(!expandida)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
            saida ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-600"
          }`}
        >
          {iniciais(nomeExibido)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{nomeExibido}</span>
            {msg.deNome && (
              <span className="text-xs text-gray-400 dark:text-gray-500">&lt;{msg.deEmail}&gt;</span>
            )}
            {saida && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                enviado
              </span>
            )}
          </div>
          {!expandida && preview && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{preview}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatarData(msg.enviadoEm)}</span>
          <svg
            className={`w-4 h-4 text-gray-300 dark:text-gray-600 transition-transform flex-shrink-0 ${
              expandida ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Corpo */}
      {expandida && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3">
          <div
            className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed
              [&_a]:text-blue-600 [&_a]:underline
              [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
              [&_img]:max-w-full [&_img]:h-auto
              [&_table]:max-w-full [&_table]:border-collapse [&_td]:align-top [&_th]:align-top
              overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: sanitizarHtml(corpo) }}
          />

          {historico && (
            <div>
              <button
                type="button"
                onClick={() => setMostrarHistorico(!mostrarHistorico)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                {mostrarHistorico ? "▲ ocultar histórico" : "··· ver histórico"}
              </button>
              {mostrarHistorico && (
                <div
                  className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed
                    [&_a]:text-blue-600 [&_a]:underline [&_p]:mb-2
                    [&_img]:max-w-full [&_table]:max-w-full overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizarHtml(historico) }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const COLUNAS_SEM_RESPOSTA = ["Novo", "Resolvido"]

export function DetalheChamado({
  chamado,
  usuarioId,
  usuarioNome,
  assinatura,
}: {
  chamado: ChamadoCompleto
  usuarioId: string
  usuarioNome: string
  assinatura?: string | null
}) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [atribuindo, setAtribuindo] = useState(false)
  const [resolvendo, setResolvendo] = useState(false)
  const [mostrarEditor, setMostrarEditor] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviouNessaSessao, setEnviouNessaSessao] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>(chamado.mensagens)
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([])
  const [templates, setTemplates] = useState<
    { id: string; nome: string; assunto: string; conteudoHtml: string }[]
  >([])
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])
  const [categoriaId, setCategoriaId] = useState<string>(chamado.categoria?.id ?? "")
  const [ordem, setOrdem] = useState<"antigo" | "recente">("antigo")

  useEffect(() => {
    const buscarMensagens = async () => {
      try {
        const res = await fetch(`/api/chamados/${chamado.id}/mensagens`)
        if (!res.ok) return
        const novas: Mensagem[] = await res.json()
        setMensagens(novas)
      } catch {}
    }
    const intervalo = setInterval(buscarMensagens, 10_000)
    return () => clearInterval(intervalo)
  }, [chamado.id])

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => {
        if (r.ok) r.json().then(setUsuarios)
      })
      .catch(() => {})
    fetch("/api/templates")
      .then((r) => {
        if (r.ok) r.json().then(setTemplates)
      })
      .catch(() => {})
    fetch("/api/admin/categorias")
      .then((r) => {
        if (r.ok) r.json().then(setCategorias)
      })
      .catch(() => {})
  }, [])

  const nomeColuna = chamado.coluna.nome
  const podeResponder = !COLUNAS_SEM_RESPOSTA.includes(nomeColuna)
  const eNovo = nomeColuna === "Novo"
  const eResolvido = nomeColuna === "Resolvido"

  const clientePrincipal = chamado.participantes.find((p) => p.tipo === "PARA")?.cliente
  const paraInicial = chamado.participantes
    .filter((p) => p.tipo === "PARA")
    .map((p) => p.cliente.email)
  const ccInicial = chamado.participantes
    .filter((p) => p.tipo === "CC")
    .map((p) => p.cliente.email)

  const statusSla =
    chamado.prazoSla && !chamado.resolvidoEm
      ? (() => {
          const diff = new Date(chamado.prazoSla).getTime() - Date.now()
          if (diff < 0) return "vencido"
          if (diff < 2 * 3_600_000) return "critico"
          if (diff < 8 * 3_600_000) return "atencao"
          return "ok"
        })()
      : null

  const mensagensOrdenadas = [...mensagens].sort((a, b) => {
    const da = new Date(a.enviadoEm).getTime()
    const db = new Date(b.enviadoEm).getTime()
    return ordem === "antigo" ? da - db : db - da
  })

  async function handleVoltar() {
    if (nomeColuna === "Em Atendimento" && !enviouNessaSessao) {
      await fetch(`/api/chamados/${chamado.id}/pausar`, { method: "POST" }).catch(() => {})
    }
    router.back()
  }

  async function handleResolver() {
    setResolvendo(true)
    setErro(null)
    try {
      const res = await fetch(`/api/chamados/${chamado.id}/resolver`, { method: "POST" })
      if (!res.ok) throw new Error("Falha ao resolver")
      router.back()
    } catch (e: any) {
      setErro(e.message ?? "Erro ao resolver")
    } finally {
      setResolvendo(false)
    }
  }

  async function handleCategoria(novaId: string) {
    setCategoriaId(novaId)
    await fetch(`/api/chamados/${chamado.id}/categoria`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoriaId: novaId || null }),
    }).catch(() => {})
  }

  async function handleAtribuir(responsavelId?: string) {
    setAtribuindo(true)
    setErro(null)
    try {
      const res = await fetch(`/api/chamados/${chamado.id}/atribuir`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsavelId }),
      })
      if (!res.ok) throw new Error("Falha ao atribuir")
      router.refresh()
    } catch (e: any) {
      setErro(e.message ?? "Erro ao atribuir")
    } finally {
      setAtribuindo(false)
    }
  }

  async function handleResponder(
    html: string,
    acao: AcaoEnvio,
    para: string[],
    cc: string[],
    arquivos: File[],
  ) {
    setEnviando(true)
    setErro(null)
    try {
      const fd = new FormData()
      fd.append("conteudoHtml", html)
      fd.append("acao", acao)
      para.forEach((e) => fd.append("para", e))
      cc.forEach((e) => fd.append("cc", e))
      arquivos.forEach((f) => fd.append("arquivos", f))

      const res = await fetch(`/api/chamados/${chamado.id}/responder`, { method: "POST", body: fd })
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}))
        throw new Error(dados.erro ?? `Erro ${res.status}`)
      }
      setEnviouNessaSessao(true)
      setMostrarEditor(false)
      const resMensagens = await fetch(`/api/chamados/${chamado.id}/mensagens`)
      if (resMensagens.ok) setMensagens(await resMensagens.json())
      router.refresh()
    } catch (e: any) {
      setErro(e.message ?? "Erro ao enviar")
    } finally {
      setEnviando(false)
    }
  }

  const editorBlock = podeResponder &&
    (mostrarEditor ? (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <EditorResposta
          paraInicial={paraInicial}
          ccInicial={ccInicial}
          assinatura={assinatura}
          templates={templates}
          onEnviar={handleResponder}
          onCancelar={() => {
            setMostrarEditor(false)
            setErro(null)
          }}
          enviando={enviando}
        />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setMostrarEditor(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-sm text-gray-400 dark:text-gray-500 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
        Responder
      </button>
    ))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={handleVoltar}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {chamado.assunto}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: chamado.coluna.cor }}
            >
              {chamado.coluna.nome}
            </span>
            {chamado.prioridade && (
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: chamado.prioridade.cor }}
              >
                {chamado.prioridade.nome}
              </span>
            )}
            {statusSla === "vencido" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                SLA vencido
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Área principal */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Controles de ordenação */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setOrdem("antigo")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    ordem === "antigo"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  Mais antigo
                </button>
                <button
                  type="button"
                  onClick={() => setOrdem("recente")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    ordem === "recente"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  Mais recente
                </button>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {mensagens.length} {mensagens.length === 1 ? "mensagem" : "mensagens"}
              </span>
            </div>

            {/* Responder no topo quando "mais recente" */}
            {ordem === "recente" && editorBlock}

            {mensagens.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                Nenhuma mensagem ainda.
              </div>
            )}

            {mensagensOrdenadas.map((msg) => (
              <ItemMensagem key={msg.id} msg={msg} />
            ))}

            {erro && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {erro}
              </div>
            )}

            {eNovo && (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center bg-white dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Atribua este chamado para começar o atendimento.
                </p>
                <button
                  type="button"
                  onClick={() => handleAtribuir()}
                  disabled={atribuindo}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  {atribuindo ? "Atribuindo..." : "Atribuir a mim"}
                </button>
              </div>
            )}

            {eResolvido && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900">
                Chamado resolvido
                {chamado.resolvidoEm ? ` em ${formatarData(chamado.resolvidoEm)}` : ""}.
              </div>
            )}

            {/* Responder no final quando "mais antigo" (padrão) */}
            {ordem === "antigo" && editorBlock}
          </div>
        </main>

        {/* Barra lateral */}
        <aside className="w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto flex-shrink-0 p-5 space-y-5">
          {!eResolvido && (
            <button
              type="button"
              onClick={handleResolver}
              disabled={resolvendo}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {resolvendo ? "Resolvendo..." : "Resolver sem responder"}
            </button>
          )}

          {/* Contato */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Contato
            </p>
            {clientePrincipal ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-semibold flex-shrink-0">
                  {iniciais(clientePrincipal.nome || clientePrincipal.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {clientePrincipal.nome ?? "—"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {clientePrincipal.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sem contato</p>
            )}
          </div>

          {/* Responsável */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Responsável
            </p>
            <select
              value={chamado.responsavel?.id ?? ""}
              onChange={(e) => handleAtribuir(e.target.value || undefined)}
              disabled={atribuindo}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="">Não atribuído</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
            {atribuindo && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Atualizando...</p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Categoria
            </p>
            <select
              value={categoriaId}
              onChange={(e) => handleCategoria(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Prazo SLA */}
          {chamado.prazoSla && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                Prazo SLA
              </p>
              <p
                className={`text-sm font-medium ${
                  statusSla === "vencido"
                    ? "text-red-600 dark:text-red-400"
                    : statusSla === "critico"
                      ? "text-orange-500"
                      : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {formatarData(chamado.prazoSla)}
              </p>
            </div>
          )}

          {/* Datas */}
          <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                Criado em
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{formatarData(chamado.criadoEm)}</p>
            </div>
            {chamado.resolvidoEm && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                  Resolvido em
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {formatarData(chamado.resolvidoEm)}
                </p>
              </div>
            )}
          </div>

          {/* Participantes */}
          {chamado.participantes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                Participantes
              </p>
              <div className="space-y-2">
                {chamado.participantes.map((p) => (
                  <div key={p.cliente.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-medium flex-shrink-0">
                      {iniciais(p.cliente.nome || p.cliente.email)}
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate min-w-0">
                      {p.cliente.nome ?? p.cliente.email}
                    </p>
                    <span className="text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">
                      {p.tipo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
