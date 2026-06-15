import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/regras/[id]">) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id } = await ctx.params
  const body = await req.json()
  const { nome, descricao, gatilho, operador, ativo, condicoes, acoes } = body

  // Se vier apenas o campo ativo, é um toggle simples
  if (Object.keys(body).length === 1 && "ativo" in body) {
    const regra = await prisma.autoRegra.update({
      where: { id },
      data: { ativo },
      include: { condicoes: true, acoes: true },
    })
    return NextResponse.json(regra)
  }

  // Atualização completa: recria condicoes e acoes
  await prisma.$transaction([
    prisma.condicaoAutoRegra.deleteMany({ where: { regraId: id } }),
    prisma.acaoAutoRegra.deleteMany({ where: { regraId: id } }),
  ])

  const regra = await prisma.autoRegra.update({
    where: { id },
    data: {
      nome: nome?.trim(),
      descricao: descricao?.trim() || null,
      gatilho,
      operador: operador ?? "E",
      ativo: ativo ?? true,
      condicoes: {
        create: (condicoes ?? []).map((c: { campo: string; operador: string; valor: string }) => ({
          campo: c.campo,
          operador: c.operador,
          valor: c.valor,
        })),
      },
      acoes: {
        create: (acoes ?? []).map((a: { tipo: string; valor: string }) => ({
          tipo: a.tipo,
          valor: a.valor,
        })),
      },
    },
    include: { condicoes: true, acoes: true },
  })

  return NextResponse.json(regra)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/regras/[id]">) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { id } = await ctx.params
  await prisma.autoRegra.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
