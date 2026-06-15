import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const deptId = req.nextUrl.searchParams.get("deptId") || undefined

  let horarios = await prisma.horarioAtendimento.findMany({
    where: deptId ? { departamentoId: deptId } : { departamentoId: null },
    orderBy: { diaSemana: "asc" },
  })

  if (horarios.length === 0) {
    await prisma.horarioAtendimento.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        diaSemana: d,
        horaInicio: "08:00",
        horaFim: "18:00",
        ativo: d >= 1 && d <= 5,
        departamentoId: deptId ?? null,
      })),
    })
    horarios = await prisma.horarioAtendimento.findMany({
      where: deptId ? { departamentoId: deptId } : { departamentoId: null },
      orderBy: { diaSemana: "asc" },
    })
  }

  return NextResponse.json(horarios)
}

export async function PUT(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const horarios: { id: string; ativo: boolean; horaInicio: string; horaFim: string }[] = await req.json()

  await Promise.all(
    horarios.map((h) =>
      prisma.horarioAtendimento.update({
        where: { id: h.id },
        data: { ativo: h.ativo, horaInicio: h.horaInicio, horaFim: h.horaFim },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
