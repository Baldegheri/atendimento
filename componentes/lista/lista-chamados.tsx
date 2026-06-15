"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import type { Coluna, Chamado } from "@/componentes/kanban/tipos"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularStatusSla(prazoSla: string | null, resolvidoEm: string | null, colunaResolvida: boolean) {
  if (!prazoSla || resolvidoEm || colunaResolvida) return null
  const diff = new Date(prazoSla).getTime() - Date.now()
  if (diff < 0) return "vencido"
  if (diff < 2 * 3_600_000) return "critico"
  if (diff < 8 * 3_600_000) return "atencao"
  return "ok"
}

function iniciais(texto: string) {
  return texto.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

function formatarData(data: string) {
  const d = new Date(data)
  const hoje = new Date()
  const mesmodia =
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  if (mesmodia) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function inicioDodia(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function diasAtras(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ChamadoComColuna = Chamado & {
  coluna: { id: string; nome: string; cor: string; resolvido: boolean }
}

type PeriodoOpcao = "" | "hoje" | "7dias" | "30dias" | "mes"
type SlaOpcao = "" | "vencido" | "critico" | "atencao"

const LABELS_PERIODO: Record<string, string> = {
  "": "Qualquer data",
  hoje: "Hoje",
  "7dias": "Últimos 7 dias",
  "30dias": "Últimos 30 dias",
  mes: "Este mês",
}

const LABELS_SLA: Record<string, string> = {
  "": "Qualquer SLA",
  vencido: "SLA vencido",
  critico: "SLA crítico",
  atencao: "SLA próximo",
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ListaChamados({
  colunas,
  usuarioId,
  departamentoId,
}: {
  colunas: Coluna[]
  usuarioId?: string
  departamentoId?: string
}) {
  const [colunaFiltro, setColunaFiltro] = useState("todas")
  const [visao, setVisao] = useState<"todos" | "meus">("todos")
  const [busca, setBusca] = useState("")
  const [periodo, setPeriodo] = useState<PeriodoOpcao>("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  const [prioridadeFiltro, setPrioridadeFiltro] = useState("")
  const [responsavelFiltro, setResponsavelFiltro] = useState("")
  const [slaFiltro, setSlaFiltro] = useState<SlaOpcao>("")

  // Achata todos os chamados de todas as colunas
  const todos: ChamadoComColuna[] = useMemo(
    () =>
      colunas.flatMap((col) =>
        col.chamados.map((c) => ({
          ...c,
          coluna: { id: col.id, nome: col.nome, cor: col.cor, resolvido: col.resolvido },
        }))
      ),
    [colunas]
  )

  // Opções únicas para os dropdowns, derivadas dos dados
  const categorias = useMemo(
    () => [...new Set(todos.map((c) => c.categoria?.nome).filter(Boolean))] as string[],
    [todos]
  )
  const prioridades = useMemo(
    () =>
      [...new Map(
        todos
          .filter((c) => c.prioridade)
          .map((c) => [c.prioridade!.nome, c.prioridade!])
      ).values()],
    [todos]
  )
  const responsaveis = useMemo(
    () =>
      [...new Map(
        todos
          .filter((c) => c.responsavel && c.responsavelId)
          .map((c) => [c.responsavelId!, { id: c.responsavelId!, nome: c.responsavel!.nome }])
      ).values()],
    [todos]
  )

  const temFiltroAtivo =
    busca || periodo || categoriaFiltro || prioridadeFiltro || responsavelFiltro || slaFiltro || visao === "meus"

  function limparFiltros() {
    setBusca("")
    setPeriodo("")
    setCategoriaFiltro("")
    setPrioridadeFiltro("")
    setResponsavelFiltro("")
    setSlaFiltro("")
    setVisao("todos")
  }

  // Filtro de período → corte mínimo de data
  const cortePeriodo = useMemo<Date | null>(() => {
    if (periodo === "hoje") return inicioDodia(new Date())
    if (periodo === "7dias") return diasAtras(7)
    if (periodo === "30dias") return diasAtras(30)
    if (periodo === "mes") {
      const d = new Date()
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return d
    }
    return null
  }, [periodo])

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return todos
      .filter((c) => colunaFiltro === "todas" || c.coluna.id === colunaFiltro)
      .filter((c) => visao === "todos" || c.responsavelId === usuarioId)
      .filter((c) => {
        if (!termo) return true
        const cliente = c.participantes[0]?.cliente
        return (
          c.assunto.toLowerCase().includes(termo) ||
          cliente?.email.toLowerCase().includes(termo) ||
          (cliente?.nome ?? "").toLowerCase().includes(termo)
        )
      })
      .filter((c) => !cortePeriodo || new Date(c.criadoEm) >= cortePeriodo)
      .filter((c) => !categoriaFiltro || c.categoria?.nome === categoriaFiltro)
      .filter((c) => !prioridadeFiltro || c.prioridade?.nome === prioridadeFiltro)
      .filter((c) => !responsavelFiltro || c.responsavelId === responsavelFiltro)
      .filter((c) => {
        if (!slaFiltro) return true
        const status = calcularStatusSla(c.prazoSla, c.resolvidoEm, c.coluna.resolvido)
        return status === slaFiltro
      })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
  }, [todos, colunaFiltro, visao, usuarioId, busca, cortePeriodo, categoriaFiltro, prioridadeFiltro, responsavelFiltro, slaFiltro])

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Abas de coluna */}
      <div className="flex items-center gap-1 overflow-x-auto flex-shrink-0">
        <button
          onClick={() => setColunaFiltro("todas")}
          className={`text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            colunaFiltro === "todas"
              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          Todos ({todos.length})
        </button>
        {colunas.map((col) => (
          <button
            key={col.id}
            onClick={() => setColunaFiltro(col.id)}
            className={`text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              colunaFiltro === col.id
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.cor }} />
            {col.nome} ({col.chamados.length})
          </button>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">

        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por assunto ou remetente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Período */}
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as PeriodoOpcao)}
          className={`text-sm border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            periodo
              ? "border-blue-500 text-blue-700 dark:text-blue-400 dark:border-blue-500"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          {Object.entries(LABELS_PERIODO).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Categoria */}
        {categorias.length > 0 && (
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className={`text-sm border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              categoriaFiltro
                ? "border-blue-500 text-blue-700 dark:text-blue-400 dark:border-blue-500"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            <option value="">Categoria</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Prioridade */}
        {prioridades.length > 0 && (
          <select
            value={prioridadeFiltro}
            onChange={(e) => setPrioridadeFiltro(e.target.value)}
            className={`text-sm border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              prioridadeFiltro
                ? "border-blue-500 text-blue-700 dark:text-blue-400 dark:border-blue-500"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            <option value="">Prioridade</option>
            {prioridades.map((p) => (
              <option key={p.nome} value={p.nome}>{p.nome}</option>
            ))}
          </select>
        )}

        {/* Responsável */}
        {responsaveis.length > 0 && (
          <select
            value={responsavelFiltro}
            onChange={(e) => setResponsavelFiltro(e.target.value)}
            className={`text-sm border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              responsavelFiltro
                ? "border-blue-500 text-blue-700 dark:text-blue-400 dark:border-blue-500"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            <option value="">Responsável</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        )}

        {/* SLA */}
        <select
          value={slaFiltro}
          onChange={(e) => setSlaFiltro(e.target.value as SlaOpcao)}
          className={`text-sm border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            slaFiltro
              ? "border-blue-500 text-blue-700 dark:text-blue-400 dark:border-blue-500"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          {Object.entries(LABELS_SLA).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Meus / Todos */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setVisao("todos")}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              visao === "todos"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setVisao("meus")}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              visao === "meus"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Meus
          </button>
        </div>

        {/* Limpar filtros */}
        {temFiltroAtivo && (
          <button
            onClick={limparFiltros}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar
          </button>
        )}
      </div>

      {/* Contagem */}
      <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        {filtrados.length} {filtrados.length === 1 ? "chamado" : "chamados"}
        {temFiltroAtivo && " encontrados"}
      </p>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        {filtrados.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            Nenhum chamado encontrado.
            {temFiltroAtivo && (
              <button onClick={limparFiltros} className="block mx-auto mt-2 text-blue-500 hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {filtrados.map((chamado) => {
          const statusSla = calcularStatusSla(chamado.prazoSla, chamado.resolvidoEm, chamado.coluna.resolvido)
          const clientePrincipal = chamado.participantes[0]?.cliente
          const nomeCliente = clientePrincipal?.nome ?? clientePrincipal?.email ?? "—"

          return (
            <Link
              key={chamado.id}
              href={departamentoId ? `/painel/${departamentoId}/chamados/${chamado.id}` : `/painel/chamados/${chamado.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Indicador de coluna */}
              <span
                className="w-1 self-stretch rounded-full flex-shrink-0 min-h-[36px]"
                style={{ backgroundColor: chamado.coluna.cor }}
              />

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-semibold flex-shrink-0">
                {iniciais(nomeCliente)}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">
                    {nomeCliente}
                  </span>
                  {chamado.responsavel && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 hidden sm:block">
                      → {chamado.responsavel.nome.split(" ")[0]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{chamado.assunto}</span>
                  {chamado.categoria && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:block">
                      {chamado.categoria.nome}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges e data */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {chamado.prioridade && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium hidden md:block"
                    style={{ backgroundColor: chamado.prioridade.cor }}
                  >
                    {chamado.prioridade.nome}
                  </span>
                )}

                {statusSla && statusSla !== "ok" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block ${
                      statusSla === "vencido"
                        ? "bg-red-100 text-red-700"
                        : statusSla === "critico"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {statusSla === "vencido" ? "SLA vencido" : statusSla === "critico" ? "SLA crítico" : "SLA próximo"}
                  </span>
                )}

                <span className="text-xs text-gray-400 dark:text-gray-500 w-10 text-right">
                  {formatarData(chamado.criadoEm)}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
