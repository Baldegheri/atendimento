import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/departamentos/[id]">) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id } = await ctx.params
  const { nome, descricao, cor, ativo } = await req.json()

  const dept = await prisma.departamento.update({
    where: { id },
    data: {
      nome: nome?.trim() || undefined,
      descricao: descricao !== undefined ? descricao?.trim() || null : undefined,
      cor: cor || undefined,
      ativo: ativo !== undefined ? ativo : undefined,
    },
  })
  return NextResponse.json(dept)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/departamentos/[id]">) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id } = await ctx.params
  await prisma.departamento.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}
