import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/colunas/[id]">) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id } = await ctx.params
  await prisma.colunaKanban.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
