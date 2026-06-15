import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/departamentos/[id]/membros/[userId]">
) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id, userId } = await ctx.params
  await prisma.membroDepartamento.deleteMany({
    where: { departamentoId: id, usuarioId: userId },
  })
  return NextResponse.json({ ok: true })
}
