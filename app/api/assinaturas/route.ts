import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const assinaturas = await prisma.assinaturaEmail.findMany({
    where: { usuarioId: sessao.user.id },
    orderBy: [{ padrao: "desc" }, { criadoEm: "asc" }],
  })
  return NextResponse.json(assinaturas)
}

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { nome, conteudoHtml, padrao } = await req.json()

  if (padrao) {
    await prisma.assinaturaEmail.updateMany({
      where: { usuarioId: sessao.user.id },
      data: { padrao: false },
    })
  }

  const assinatura = await prisma.assinaturaEmail.create({
    data: { usuarioId: sessao.user.id, nome, conteudoHtml, padrao: padrao ?? false },
  })
  return NextResponse.json(assinatura)
}
