import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const regras = await prisma.regraCategoria.findMany({
    include: { categoria: { select: { id: true, nome: true } } },
    orderBy: { criadoEm: "asc" },
  })
  return NextResponse.json(regras)
}

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { palavraChave, categoriaId } = await req.json()
  const regra = await prisma.regraCategoria.create({
    data: { palavraChave, categoriaId },
    include: { categoria: { select: { id: true, nome: true } } },
  })
  return NextResponse.json(regra)
}
