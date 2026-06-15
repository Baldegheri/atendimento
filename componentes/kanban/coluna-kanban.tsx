"use client"

import { useDroppable } from "@dnd-kit/core"
import type { Coluna } from "./tipos"
import { CartaoChamado } from "./cartao-chamado"

export function ColunaKanban({ coluna, departamentoId }: { coluna: Coluna; departamentoId?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id })

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: coluna.cor }} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">{coluna.nome}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 px-2 py-0.5 rounded-full font-medium">
          {coluna.chamados.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 min-h-32 rounded-xl p-3 transition-colors ${
          isOver
            ? "bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 border-dashed"
            : "bg-gray-100 dark:bg-gray-800/50"
        }`}
      >
        {coluna.chamados.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-600 text-xs">
            Nenhum chamado
          </div>
        ) : (
          coluna.chamados.map((chamado) => (
            <CartaoChamado key={chamado.id} chamado={chamado} colunaResolvida={coluna.resolvido} departamentoId={departamentoId} />
          ))
        )}
      </div>
    </div>
  )
}
