import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/chamados/[id]/atribuir">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()
  const responsavelId: string | undefined = body.responsavelId || sessao.user.id

  const chamado = await prisma.chamado.findUnique({
    where: { id },
    include: { coluna: { select: { nome: true } } },
  })
  if (!chamado) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  const dados: Record<string, unknown> = { responsavelId: responsavelId ?? null }

  if (chamado.coluna.nome === "Novo" && responsavelId) {
    const colunaEmAtendimento = await prisma.colunaKanban.findFirst({ where: { nome: "Em Atendimento" } })
    if (colunaEmAtendimento) dados.colunaId = colunaEmAtendimento.id
  }

  await prisma.chamado.update({ where: { id }, data: dados })

  return NextResponse.json({ ok: true })
}
