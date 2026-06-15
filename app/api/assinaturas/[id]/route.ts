import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/assinaturas/[id]">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  const { nome, conteudoHtml, padrao } = await req.json()

  if (padrao) {
    await prisma.assinaturaEmail.updateMany({
      where: { usuarioId: sessao.user.id },
      data: { padrao: false },
    })
  }

  const assinatura = await prisma.assinaturaEmail.update({
    where: { id },
    data: { nome, conteudoHtml, padrao: padrao ?? false },
  })
  return NextResponse.json(assinatura)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/assinaturas/[id]">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  await prisma.assinaturaEmail.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
