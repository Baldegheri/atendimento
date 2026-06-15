import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { executarRegras } from "@/lib/regras/engine"

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/chamados/[id]/resolver">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params

  const colunaResolvido = await prisma.colunaKanban.findFirst({ where: { resolvido: true } })

  await prisma.chamado.update({
    where: { id },
    data: {
      resolvidoEm: new Date(),
      ...(colunaResolvido ? { colunaId: colunaResolvido.id } : {}),
    },
  })

  executarRegras("CHAMADO_RESOLVIDO", id).catch((e) =>
    console.error("[resolver] Erro ao executar regras:", e),
  )

  return NextResponse.json({ ok: true })
}
