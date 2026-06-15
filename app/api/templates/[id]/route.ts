import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/templates/[id]">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  const { nome, assunto, conteudoHtml } = await req.json()

  const template = await prisma.templateEmail.update({
    where: { id },
    data: { nome, assunto, conteudoHtml },
  })
  return NextResponse.json(template)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/templates/[id]">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params
  await prisma.templateEmail.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
