import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const deptId = req.nextUrl.searchParams.get("deptId")

  const regras = await prisma.autoRegra.findMany({
    where: deptId ? { departamentoId: deptId } : {},
    include: { condicoes: true, acoes: true },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  })

  return NextResponse.json(regras)
}

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { nome, descricao, gatilho, operador, ativo, departamentoId, condicoes, acoes } =
    await req.json()

  if (!nome?.trim() || !gatilho)
    return NextResponse.json({ erro: "Nome e gatilho são obrigatórios" }, { status: 400 })

  const regra = await prisma.autoRegra.create({
    data: {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      gatilho,
      operador: operador ?? "E",
      ativo: ativo ?? true,
      departamentoId: departamentoId || null,
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
