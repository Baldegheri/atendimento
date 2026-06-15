"use client"

import { useState } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

type Departamento = {
  id: string
  nome: string
  descricao: string | null
  cor: string
  _count: { chamados: number; membros: number }
}

function ModalNovoDepartamento({ onFechar, onCriado }: {
  onFechar: () => void
  onCriado: (id: string) => void
}) {
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [cor, setCor] = useState("#3b82f6")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function criar() {
    if (!nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch("/api/departamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), descricao: descricao.trim() || null, cor }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.erro ?? "Erro ao criar")
      }
      const dept = await res.json()
      onCriado(dept.id)
    } catch (e: any) {
      setErro(e.message)
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Novo departamento</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Núcleo de Experiência do Parceiro"
              autoFocus
              className="w-full text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Descrição (opcional)</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do time"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Cor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-9 w-12 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-gray-400">{cor}</span>
            </div>
          </div>
        </div>

        {erro && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={criar}
            disabled={salvando || !nome.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {salvando ? "Criando..." : "Criar departamento"}
          </button>
          <button
            onClick={onFechar}
            className="px-4 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export function SeletorDepartamento({
  departamentos: inicial,
  isAdm,
  usuarioId,
  usuarioNome,
  usuarioCargo,
}: {
  departamentos: Departamento[]
  isAdm: boolean
  usuarioId: string
  usuarioNome: string
  usuarioCargo: string
}) {
  const router = useRouter()
  const [departamentos, setDepartamentos] = useState(inicial)
  const [criando, setCriando] = useState(false)
  const [confirmandoDelete, setConfirmandoDelete] = useState<string | null>(null)
  const [deletando, setDeletando] = useState(false)

  function handleCriado(id: string) {
    setCriando(false)
    router.push(`/painel/${id}`)
  }

  async function deletarDepartamento(id: string) {
    setDeletando(true)
    try {
      const res = await fetch(`/api/departamentos/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao deletar")
      setDepartamentos((prev) => prev.filter((d) => d.id !== id))
      setConfirmandoDelete(null)
    } catch {
      alert("Erro ao deletar departamento")
    } finally {
      setDeletando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">Sistema de Atendimento</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{usuarioNome}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{usuarioCargo}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Selecionar departamento</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Escolha o time para acessar</p>
            </div>
            {isAdm && (
              <button
                onClick={() => setCriando(true)}
                className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo departamento
              </button>
            )}
          </div>

          {departamentos.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-600">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm font-medium">
                {isAdm ? "Nenhum departamento criado ainda" : "Você não pertence a nenhum departamento"}
              </p>
              {!isAdm && <p className="text-xs mt-1">Entre em contato com um administrador</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departamentos.map((dept) => (
                <div
                  key={dept.id}
                  className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
                >
                  <Link href={`/painel/${dept.id}`} className="block p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: dept.cor + "20" }}
                      >
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dept.cor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-6">
                          {dept.nome}
                        </h2>
                        {dept.descricao && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{dept.descricao}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                            {dept._count.chamados} chamados
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {dept._count.membros} {dept._count.membros === 1 ? "membro" : "membros"}
                          </span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>

                  {isAdm && (
                    confirmandoDelete === dept.id ? (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1 shadow-sm">
                        <span className="text-xs text-red-600 dark:text-red-400 mr-1">Excluir?</span>
                        <button
                          onClick={() => deletarDepartamento(dept.id)}
                          disabled={deletando}
                          className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2 py-0.5 rounded"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmandoDelete(null)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1 py-0.5"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmandoDelete(dept.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Excluir departamento"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {criando && <ModalNovoDepartamento onFechar={() => setCriando(false)} onCriado={handleCriado} />}
    </div>
  )
}
