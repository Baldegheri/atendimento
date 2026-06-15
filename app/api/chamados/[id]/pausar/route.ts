import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/chamados/[id]/pausar">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params

  const chamado = await prisma.chamado.findUnique({
    where: { id },
    include: { coluna: { select: { nome: true } } },
  })
  if (!chamado) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  if (chamado.coluna.nome === "Em Atendimento") {
    const colunaAtribuido = await prisma.colunaKanban.findFirst({ where: { nome: "Atribuído" } })
    if (colunaAtribuido) {
      await prisma.chamado.update({
        where: { id },
        data: { colunaId: colunaAtribuido.id },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
