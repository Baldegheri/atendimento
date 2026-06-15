import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/chamados/[id]/mover">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  const { colunaId } = await req.json()

  await prisma.chamado.update({
    where: { id },
    data: { colunaId },
  })

  return NextResponse.json({ ok: true })
}
