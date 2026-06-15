"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useState, useEffect, useRef } from "react"
import type { Chamado, Coluna } from "./tipos"
import { ColunaKanban } from "./coluna-kanban"
import { CartaoChamado } from "./cartao-chamado"
import { NovoChamadoModal } from "@/componentes/chamado/novo-chamado-modal"
import { BuscaChamados } from "./busca-chamados"

type Categoria = { id: string; nome: string }
type Prioridade = { id: string; nome: string; cor: string }

export function QuadroKanban({
  colunasIniciais,
  categorias = [],
  prioridades = [],
  assinatura,
  usuarioId,
  departamentoId,
}: {
  colunasIniciais: Coluna[]
  categorias?: Categoria[]
  prioridades?: Prioridade[]
  assinatura?: string | null
  usuarioId?: string
  departamentoId?: string
}) {
  const [colunas, setColunas] = useState(colunasIniciais)
  const [chamadoAtivo, setChamadoAtivo] = useState<Chamado | null>(null)
  const [filtro, setFiltro] = useState<"todos" | "meus">("todos")
  const [mostrarNovoChamado, setMostrarNovoChamado] = useState(false)
  const arrastando = useRef(false)

  useEffect(() => {
    const sincronizar = async () => {
      if (arrastando.current) return
      const url = departamentoId ? `/api/kanban/estado?deptId=${departamentoId}` : "/api/kanban/estado"
      const res = await fetch(url)
      if (!res.ok) return
      const dados = await res.json()
      setColunas(dados)
    }
    const intervalo = setInterval(sincronizar, 15_000)
    return () => clearInterval(intervalo)
  }, [])

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function encontrarChamado(id: string) {
    for (const coluna of colunas) {
      const chamado = coluna.chamados.find((c) => c.id === id)
      if (chamado) return chamado
    }
    return null
  }

  function encontrarColunaDoCard(chamadoId: string) {
    return colunas.find((col) => col.chamados.some((c) => c.id === chamadoId))
  }

  function aoIniciarArrasto({ active }: DragStartEvent) {
    arrastando.current = true
    setChamadoAtivo(encontrarChamado(active.id as string))
  }

  async function aoSoltarArrasto({ active, over }: DragEndEvent) {
    arrastando.current = false
    setChamadoAtivo(null)
    if (!over) return

    const colunaOrigem = encontrarColunaDoCard(active.id as string)
    const colunaDestino = colunas.find((c) => c.id === over.id)

    if (!colunaOrigem || !colunaDestino) return
    if (colunaOrigem.id === colunaDestino.id) return

    const chamado = colunaOrigem.chamados.find((c) => c.id === active.id)!

    setColunas((prev) =>
      prev.map((col) => {
        if (col.id === colunaOrigem.id) {
          return { ...col, chamados: col.chamados.filter((c) => c.id !== active.id) }
        }
        if (col.id === colunaDestino.id) {
          return { ...col, chamados: [chamado, ...col.chamados] }
        }
        return col
      })
    )

    await fetch(`/api/chamados/${active.id}/mover`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colunaId: colunaDestino.id }),
    })
  }

  const colunasFiltradas = filtro === "meus" && usuarioId
    ? colunas.map((col) => ({ ...col, chamados: col.chamados.filter((c) => c.responsavelId === usuarioId) }))
    : colunas

  const totalChamados = colunas.reduce((acc, col) => acc + col.chamados.length, 0)
  const slaVencidos = colunas
    .flatMap((col) => col.chamados)
    .filter((c) => c.prazoSla && new Date(c.prazoSla) < new Date()).length

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Barra de controles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BuscaChamados departamentoId={departamentoId} />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFiltro("todos")}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                filtro === "todos"
                  ? "bg-white text-gray-900 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Todos ({totalChamados})
            </button>
            <button
              onClick={() => setFiltro("meus")}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                filtro === "meus"
                  ? "bg-white text-gray-900 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Meus chamados
            </button>
          </div>

          {slaVencidos > 0 && (
            <span className="text-xs font-medium bg-red-100 text-red-700 px-3 py-1.5 rounded-lg">
              ⚠ {slaVencidos} com SLA vencido
            </span>
          )}
        </div>

        <button
          onClick={() => setMostrarNovoChamado(true)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo chamado
        </button>
      </div>

      {/* Kanban */}
      <DndContext
        id="kanban"
        sensors={sensores}
        collisionDetection={closestCenter}
        onDragStart={aoIniciarArrasto}
        onDragEnd={aoSoltarArrasto}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {colunasFiltradas.map((coluna) => (
            <ColunaKanban key={coluna.id} coluna={coluna} departamentoId={departamentoId} />
          ))}
        </div>

        <DragOverlay>
          {chamadoAtivo && <CartaoChamado chamado={chamadoAtivo} arrastando departamentoId={departamentoId} />}
        </DragOverlay>
      </DndContext>
    </div>

    {mostrarNovoChamado && (
      <NovoChamadoModal
        onFechar={() => setMostrarNovoChamado(false)}
        categorias={categorias}
        prioridades={prioridades}
        assinatura={assinatura}
        departamentoId={departamentoId}
      />
    )}
  </>
  )
}
