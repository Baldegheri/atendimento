import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const deptId = req.nextUrl.searchParams.get("deptId") || undefined
  const categorias = await prisma.categoria.findMany({
    where: deptId ? { departamentoId: deptId } : undefined,
    select: { id: true, nome: true, descricao: true },
    orderBy: { nome: "asc" },
  })
  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { nome, descricao, departamentoId } = await req.json()
  const categoria = await prisma.categoria.create({
    data: { nome, descricao: descricao ?? null, departamentoId: departamentoId ?? null },
  })
  return NextResponse.json(categoria)
}
