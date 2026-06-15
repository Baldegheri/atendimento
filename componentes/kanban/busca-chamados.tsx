"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

type Resultado = {
  id: string
  assunto: string
  criadoEm: string
  coluna: { nome: string; cor: string }
  prioridade: { nome: string; cor: string } | null
  participantes: { cliente: { email: string; nome: string | null } }[]
}

export function BuscaChamados({ departamentoId }: { departamentoId?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [aberto, setAberto] = useState(false)
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1)
  const [buscando, setBuscando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (query.length < 2) {
      setResultados([])
      setAberto(false)
      return
    }
    setBuscando(true)
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/chamados/buscar?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const dados = await res.json()
        setResultados(dados)
        setAberto(true)
        setIndiceSelecionado(-1)
      }
      setBuscando(false)
    }, 250)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [query])

  function navegar(id: string) {
    router.push(departamentoId ? `/painel/${departamentoId}/chamados/${id}` : `/painel/chamados/${id}`)
    setQuery("")
    setResultados([])
    setAberto(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto || resultados.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIndiceSelecionado((prev) => Math.min(prev + 1, resultados.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setIndiceSelecionado((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && indiceSelecionado >= 0) {
      e.preventDefault()
      navegar(resultados[indiceSelecionado].id)
    } else if (e.key === "Escape") {
      setAberto(false)
      setIndiceSelecionado(-1)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
        {buscando ? (
          <svg className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (resultados.length > 0) setAberto(true) }}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Buscar chamados..."
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResultados([]); setAberto(false) }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {aberto && resultados.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {resultados.map((c, i) => {
            const cliente = c.participantes[0]?.cliente
            return (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); navegar(c.id) }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                  i === indiceSelecionado ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: c.coluna.cor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.assunto}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cliente && (
                      <span className="text-xs text-gray-400 truncate">
                        {cliente.nome ?? cliente.email}
                      </span>
                    )}
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{c.coluna.nome}</span>
                  </div>
                </div>
                {c.prioridade && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ backgroundColor: c.prioridade.cor }}
                  >
                    {c.prioridade.nome}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {aberto && query.length >= 2 && !buscando && resultados.length === 0 && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 px-4 py-3">
          <p className="text-sm text-gray-400">Nenhum chamado encontrado</p>
        </div>
      )}
    </div>
  )
}
