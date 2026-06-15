"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import type { Chamado } from "./tipos"

function calcularStatusSla(prazoSla: string | null, resolvidoEm: string | null, colunaResolvida: boolean) {
  if (!prazoSla || resolvidoEm || colunaResolvida) return null
  const prazo = new Date(prazoSla)
  const agora = new Date()
  const diffMs = prazo.getTime() - agora.getTime()
  const diffHoras = diffMs / (1000 * 60 * 60)

  if (diffMs < 0) return "vencido"
  if (diffHoras < 2) return "critico"
  if (diffHoras < 8) return "atencao"
  return "ok"
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function CartaoChamado({
  chamado,
  arrastando = false,
  colunaResolvida = false,
  departamentoId,
}: {
  chamado: Chamado
  arrastando?: boolean
  colunaResolvida?: boolean
  departamentoId?: string
}) {
  const router = useRouter()
  const origemPointer = useRef<{ x: number; y: number } | null>(null)

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: chamado.id,
  })

  const estilo = {
    transform: CSS.Translate.toString(transform),
  }

  const statusSla = calcularStatusSla(chamado.prazoSla, chamado.resolvidoEm, colunaResolvida)
  const clientePrincipal = chamado.participantes[0]?.cliente

  function handlePointerDown(e: React.PointerEvent) {
    origemPointer.current = { x: e.clientX, y: e.clientY }
  }

  function handleClick(e: React.MouseEvent) {
    if (!origemPointer.current) return
    const dx = e.clientX - origemPointer.current.x
    const dy = e.clientY - origemPointer.current.y
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      router.push(departamentoId ? `/painel/${departamentoId}/chamados/${chamado.id}` : `/painel/chamados/${chamado.id}`)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={estilo}
      {...listeners}
      {...attributes}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none ${
        arrastando ? "opacity-50" : ""
      }`}
    >
      {/* Prioridade e categoria */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {chamado.prioridade && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: chamado.prioridade.cor }}
          >
            {chamado.prioridade.nome}
          </span>
        )}
        {chamado.categoria && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {chamado.categoria.nome}
          </span>
        )}
      </div>

      {/* Assunto */}
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug mb-3 line-clamp-2">
        {chamado.assunto}
      </p>

      {/* Cliente */}
      {clientePrincipal && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 truncate">
          {clientePrincipal.nome ?? clientePrincipal.email}
        </p>
      )}

      {/* Rodapé: SLA e responsável */}
      <div className="flex items-center justify-between mt-1">
        {statusSla && statusSla !== "ok" ? (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              statusSla === "vencido"
                ? "bg-red-100 text-red-700"
                : statusSla === "critico"
                ? "bg-orange-100 text-orange-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {statusSla === "vencido"
              ? "SLA vencido"
              : statusSla === "critico"
              ? "SLA crítico"
              : "SLA próximo"}
          </span>
        ) : (
          <span />
        )}

        {chamado.responsavel ? (
          <div
            className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
            title={chamado.responsavel.nome}
          >
            {iniciais(chamado.responsavel.nome)}
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"
            title="Sem responsável"
          >
            <span className="text-gray-400 text-xs">?</span>
          </div>
        )}
      </div>
    </div>
  )
}
