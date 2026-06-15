import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const deptId = req.nextUrl.searchParams.get("deptId") || undefined
  return NextResponse.json(
    await prisma.prioridade.findMany({
      where: deptId ? { departamentoId: deptId } : undefined,
      orderBy: { ordem: "asc" },
    })
  )
}

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { nome, horasSla, cor, ordem, departamentoId } = await req.json()
  const p = await prisma.prioridade.create({
    data: { nome, horasSla, cor, ordem, departamentoId: departamentoId ?? null },
  })
  return NextResponse.json(p)
}
