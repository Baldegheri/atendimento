import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/usuarios/[id]">) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id } = await ctx.params
  const dados = await req.json()
  const usuario = await prisma.usuario.update({ where: { id }, data: dados })
  return NextResponse.json({ cargo: usuario.cargo, status: usuario.status })
}
