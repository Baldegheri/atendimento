import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const depts =
    sessao.user.cargo === "ADM"
      ? await prisma.departamento.findMany({
          where: { ativo: true },
          include: { _count: { select: { chamados: true, membros: true } } },
          orderBy: { nome: "asc" },
        })
      : await prisma.departamento.findMany({
          where: { ativo: true, membros: { some: { usuarioId: sessao.user.id } } },
          include: { _count: { select: { chamados: true, membros: true } } },
          orderBy: { nome: "asc" },
        })

  return NextResponse.json(depts)
}

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { nome, descricao, cor } = await req.json()
  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 })

  const dept = await prisma.departamento.create({
    data: { nome: nome.trim(), descricao: descricao?.trim() || null, cor: cor ?? "#3b82f6" },
    include: { _count: { select: { chamados: true, membros: true } } },
  })

  // Add creator as member
  await prisma.membroDepartamento.create({
    data: { usuarioId: sessao.user.id, departamentoId: dept.id },
  })

  // Copy kanban structure from the oldest active department
  const referencia = await prisma.departamento.findFirst({
    where: { ativo: true, id: { not: dept.id } },
    include: { colunas: true, prioridades: true, categorias: true },
    orderBy: { criadoEm: "asc" },
  })
  if (referencia) {
    if (referencia.colunas.length > 0) {
      await prisma.colunaKanban.createMany({
        data: referencia.colunas.map((c) => ({
          nome: c.nome,
          ordem: c.ordem,
          cor: c.cor,
          padrao: c.padrao,
          resolvido: c.resolvido,
          departamentoId: dept.id,
        })),
      })
    }
    if (referencia.prioridades.length > 0) {
      await prisma.prioridade.createMany({
        data: referencia.prioridades.map((p) => ({
          nome: p.nome,
          horasSla: p.horasSla,
          cor: p.cor,
          ordem: p.ordem,
          departamentoId: dept.id,
        })),
      })
    }
    if (referencia.categorias.length > 0) {
      await prisma.categoria.createMany({
        data: referencia.categorias.map((c) => ({
          nome: c.nome,
          departamentoId: dept.id,
        })),
      })
    }
  }

  return NextResponse.json(dept)
}
