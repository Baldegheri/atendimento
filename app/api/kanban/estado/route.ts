import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const deptId = req.nextUrl.searchParams.get("deptId") || undefined

  const colunas = await prisma.colunaKanban.findMany({
    where: deptId ? { departamentoId: deptId } : undefined,
    orderBy: { ordem: "asc" },
    include: {
      chamados: {
        where: deptId ? { departamentoId: deptId } : undefined,
        include: {
          prioridade: { select: { nome: true, cor: true } },
          categoria: { select: { nome: true } },
          responsavel: { select: { nome: true, imagem: true } },
          participantes: {
            where: { removidoEm: null, tipo: "PARA" },
            include: { cliente: { select: { email: true, nome: true } } },
            take: 1,
          },
        },
        orderBy: { criadoEm: "desc" },
      },
    },
  })

  return NextResponse.json(colunas)
}
