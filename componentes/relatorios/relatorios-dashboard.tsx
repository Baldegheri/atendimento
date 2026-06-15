"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type Resumo = {
  total: number
  abertos: number
  emAndamento: number
  resolvidos: number
  slaVencido: number
}

type DadosRelatorio = {
  resumo: Resumo
  tempoMedioResposta: number | null
  tempoMedioResolucao: number | null
  taxaSla: number | null
  volumePorDia: { data: string; total: number; recebidos: number; iniciados: number }[]
  porOperador: { nome: string; total: number; resolvidos: number }[]
  porCategoria: { nome: string; total: number }[]
  porPrioridade: { nome: string; cor: string; total: number }[]
  slaVencidosDetalhe: { id: string; assunto: string; prazoSla: string; responsavel: string | null; categoria: string | null }[]
  filtros: {
    usuarios: { id: string; nome: string }[]
    categorias: { id: string; nome: string }[]
    prioridades: { id: string; nome: string; cor: string }[]
  }
}

const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]

function formatarDataCurta(data: string) {
  const [, mes, dia] = data.split("-")
  return `${dia}/${mes}`
}

function formatarHoras(h: number | null) {
  if (h === null) return "—"
  if (h < 1) return `${Math.round(h * 60)}min`
  return `${h}h`
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function exportarCSV(dados: DadosRelatorio) {
  const linhas: string[] = ["﻿"]
  linhas.push("RELATÓRIO DE ATENDIMENTO")
  linhas.push("")
  linhas.push("RESUMO")
  linhas.push(`Total de chamados,${dados.resumo.total}`)
  linhas.push(`Abertos,${dados.resumo.abertos}`)
  linhas.push(`Em andamento,${dados.resumo.emAndamento}`)
  linhas.push(`Resolvidos,${dados.resumo.resolvidos}`)
  linhas.push(`SLA vencido,${dados.resumo.slaVencido}`)
  linhas.push(`Taxa SLA,${dados.taxaSla !== null ? dados.taxaSla + "%" : "N/D"}`)
  linhas.push(`Tempo médio de resposta,${formatarHoras(dados.tempoMedioResposta)}`)
  linhas.push(`Tempo médio de resolução,${formatarHoras(dados.tempoMedioResolucao)}`)
  linhas.push("")
  linhas.push("VOLUME POR DIA")
  linhas.push("Data,Total,Recebidos,Iniciados")
  for (const d of dados.volumePorDia) {
    linhas.push(`${d.data},${d.total},${d.recebidos},${d.iniciados}`)
  }
  linhas.push("")
  linhas.push("POR OPERADOR")
  linhas.push("Operador,Total,Resolvidos")
  for (const o of dados.porOperador) {
    linhas.push(`"${o.nome}",${o.total},${o.resolvidos}`)
  }
  linhas.push("")
  linhas.push("POR CATEGORIA")
  linhas.push("Categoria,Total")
  for (const c of dados.porCategoria) {
    linhas.push(`"${c.nome}",${c.total}`)
  }
  linhas.push("")
  linhas.push("POR PRIORIDADE")
  linhas.push("Prioridade,Total")
  for (const p of dados.porPrioridade) {
    linhas.push(`"${p.nome}",${p.total}`)
  }
  if (dados.slaVencidosDetalhe.length > 0) {
    linhas.push("")
    linhas.push("SLA VENCIDO")
    linhas.push("Assunto,Prazo SLA,Responsável,Categoria")
    for (const s of dados.slaVencidosDetalhe) {
      linhas.push(`"${s.assunto}",${formatarDataHora(s.prazoSla)},"${s.responsavel ?? "—"}","${s.categoria ?? "—"}"`)
    }
  }
  const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function RelatoriosDashboard({ departamentoId, departamentoNome }: { departamentoId?: string; departamentoNome?: string }) {
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(30)
  const [responsavelId, setResponsavelId] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [prioridadeId, setPrioridadeId] = useState("")
  const [dados, setDados] = useState<DadosRelatorio | null>(null)
  const [carregando, setCarregando] = useState(true)

  const buscarDados = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ periodo: String(periodo) })
      if (responsavelId) params.set("responsavelId", responsavelId)
      if (categoriaId) params.set("categoriaId", categoriaId)
      if (prioridadeId) params.set("prioridadeId", prioridadeId)
      if (departamentoId) params.set("deptId", departamentoId)
      const res = await fetch(`/api/relatorios?${params}`)
      if (res.ok) setDados(await res.json())
    } finally {
      setCarregando(false)
    }
  }, [periodo, responsavelId, categoriaId, prioridadeId])

  useEffect(() => { buscarDados() }, [buscarDados])

  const filtros = dados?.filtros

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={departamentoId ? `/painel/${departamentoId}` : "/painel"}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Relatórios{departamentoNome ? ` — ${departamentoNome}` : ""}
          </h1>
        </div>
        {dados && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportarCSV(dados)}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / PDF
            </button>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Filtros */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Período:</span>
              <div className="flex gap-1">
                {([7, 30, 90] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      periodo === p
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {p}d
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Operador:</label>
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {filtros?.usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Categoria:</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {filtros?.categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Prioridade:</label>
              <select
                value={prioridadeId}
                onChange={(e) => setPrioridadeId(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {filtros?.prioridades.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dados ? (
          <>
            {/* Cards de status */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Abertos</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{dados.resumo.abertos}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{dados.resumo.total} total no período</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Em Andamento</p>
                <p className="text-3xl font-bold text-blue-600">{dados.resumo.emAndamento}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">atribuídos e em atendimento</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Resolvidos</p>
                <p className="text-3xl font-bold text-green-600">{dados.resumo.resolvidos}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {dados.taxaSla !== null ? `Taxa SLA: ${dados.taxaSla}%` : "sem dados SLA"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">SLA Vencido</p>
                <p className={`text-3xl font-bold ${dados.resumo.slaVencido > 0 ? "text-red-600" : "text-gray-800 dark:text-gray-100"}`}>
                  {dados.resumo.slaVencido}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">chamados sem resolução</p>
              </div>
            </div>

            {/* Cards de tempo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Tempo médio 1ª resposta</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formatarHoras(dados.tempoMedioResposta)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Tempo médio de resolução</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formatarHoras(dados.tempoMedioResolucao)}</p>
              </div>
            </div>

            {/* Volume por dia */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Volume por dia</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dados.volumePorDia} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="data"
                    tickFormatter={formatarDataCurta}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    labelFormatter={(v) => formatarDataCurta(String(v))}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="recebidos" name="Recebidos" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="iniciados" name="Iniciados" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Por operador */}
            {dados.porOperador.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Volume por operador</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Operador</th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Total</th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Resolvidos</th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Taxa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {dados.porOperador.map((op) => (
                      <tr key={op.nome}>
                        <td className="py-2.5 text-gray-800 dark:text-gray-200">{op.nome}</td>
                        <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">{op.total}</td>
                        <td className="py-2.5 text-right text-green-600">{op.resolvidos}</td>
                        <td className="py-2.5 text-right text-gray-500 dark:text-gray-400">
                          {op.total > 0 ? `${Math.round((op.resolvidos / op.total) * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Por categoria e prioridade */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dados.porCategoria.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Por categoria</h2>
                  <div className="flex items-center gap-4">
                    <PieChart width={160} height={160}>
                      <Pie
                        data={dados.porCategoria}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        labelLine={false}
                      >
                        {dados.porCategoria.map((_, i) => (
                          <Cell key={i} fill={CORES[i % CORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                    </PieChart>
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      {dados.porCategoria.map((cat, i) => (
                        <div key={cat.nome} className="flex items-center gap-2 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CORES[i % CORES.length] }} />
                          <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{cat.nome}</span>
                          <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{cat.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {dados.porPrioridade.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Por prioridade</h2>
                  <div className="space-y-3">
                    {dados.porPrioridade.map((p) => {
                      const pct = dados.resumo.total > 0 ? (p.total / dados.resumo.total) * 100 : 0
                      return (
                        <div key={p.nome}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.cor }} />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{p.nome}</span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{p.total}</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: p.cor }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SLA Vencido */}
            {dados.slaVencidosDetalhe.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    SLA Vencido — {dados.slaVencidosDetalhe.length} chamado(s)
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Assunto</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Prazo SLA</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Responsável</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">Categoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {dados.slaVencidosDetalhe.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 pr-4">
                          <Link
                            href={departamentoId ? `/painel/${departamentoId}/chamados/${s.id}` : `/painel/chamados/${s.id}`}
                            className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                          >
                            {s.assunto}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-red-600 dark:text-red-400 text-xs whitespace-nowrap">
                          {formatarDataHora(s.prazoSla)}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{s.responsavel ?? "—"}</td>
                        <td className="py-2.5 text-gray-500 dark:text-gray-500">{s.categoria ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-20">Erro ao carregar dados</p>
        )}
      </div>
    </div>
  )
}
