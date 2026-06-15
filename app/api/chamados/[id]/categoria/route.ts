import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/chamados/[id]/categoria">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  const { categoriaId } = await req.json()

  await prisma.chamado.update({
    where: { id },
    data: { categoriaId: categoriaId ?? null },
  })

  return NextResponse.json({ ok: true })
}
