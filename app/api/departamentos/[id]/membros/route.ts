import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/departamentos/[id]/membros">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  const membros = await prisma.membroDepartamento.findMany({
    where: { departamentoId: id },
    include: { usuario: { select: { id: true, nome: true, email: true, cargo: true, status: true } } },
    orderBy: { adicionadoEm: "asc" },
  })
  return NextResponse.json(membros)
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/departamentos/[id]/membros">) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id } = await ctx.params
  const { usuarioId } = await req.json()
  if (!usuarioId) return NextResponse.json({ erro: "usuarioId obrigatório" }, { status: 400 })

  const membro = await prisma.membroDepartamento.upsert({
    where: { usuarioId_departamentoId: { usuarioId, departamentoId: id } },
    update: {},
    create: { usuarioId, departamentoId: id },
    include: { usuario: { select: { id: true, nome: true, email: true, cargo: true, status: true } } },
  })
  return NextResponse.json(membro)
}
