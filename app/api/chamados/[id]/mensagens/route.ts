import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/chamados/[id]/mensagens">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params

  const mensagens = await prisma.mensagemEmail.findMany({
    where: { chamadoId: id },
    include: { destinatarios: { select: { id: true, email: true, nome: true, tipo: true } } },
    orderBy: { enviadoEm: "asc" },
  })

  return NextResponse.json(mensagens)
}
