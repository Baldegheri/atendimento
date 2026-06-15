import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  return NextResponse.json(
    await prisma.templateEmail.findMany({ orderBy: { nome: "asc" } })
  )
}

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { nome, assunto, conteudoHtml } = await req.json()
  const template = await prisma.templateEmail.create({
    data: { nome, assunto, conteudoHtml, criadoPorId: sessao.user.id },
  })
  return NextResponse.json(template)
}
