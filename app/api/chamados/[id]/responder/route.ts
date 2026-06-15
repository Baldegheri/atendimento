import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { enviarEmail } from "@/lib/email/enviar"

export async function POST(req: NextRequest, ctx: RouteContext<"/api/chamados/[id]/responder">) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { id } = await ctx.params

  try {
    const fd = await req.formData()
    const conteudoHtml = fd.get("conteudoHtml") as string
    const acao = fd.get("acao") as "enviar" | "resolver"
    const para = fd.getAll("para") as string[]
    const cc = fd.getAll("cc") as string[]

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: {
        mensagens: { orderBy: { enviadoEm: "asc" }, select: { messageId: true, direcao: true } },
        coluna: { select: { nome: true } },
      },
    })
    if (!chamado) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

    const ultimaMensagemEntrada = [...chamado.mensagens]
      .reverse()
      .find((m) => m.direcao === "ENTRADA")

    const inReplyTo = ultimaMensagemEntrada?.messageId ?? chamado.threadId ?? undefined

    const resultado = await enviarEmail({
      para,
      cc: cc.length > 0 ? cc : undefined,
      assunto: `Re: ${chamado.assunto}`,
      conteudoHtml,
      inReplyToMessageId: inReplyTo ?? undefined,
    })

    await prisma.mensagemEmail.create({
      data: {
        chamadoId: id,
        deEmail: process.env.GMAIL_USUARIO!,
        conteudoHtml,
        direcao: "SAIDA",
        messageId: resultado.messageId,
        graphMensagemId: resultado.graphMensagemId,
        destinatarios: {
          createMany: {
            data: [
              ...para.map((email) => ({ email, tipo: "PARA" as const })),
              ...cc.map((email) => ({ email, tipo: "CC" as const })),
            ],
          },
        },
      },
    })

    if (acao === "resolver") {
      const colunaResolvido = await prisma.colunaKanban.findFirst({ where: { resolvido: true } })
      await prisma.chamado.update({
        where: { id },
        data: {
          resolvidoEm: new Date(),
          ...(colunaResolvido ? { colunaId: colunaResolvido.id } : {}),
        },
      })
    } else {
      const colunaAguardando = await prisma.colunaKanban.findFirst({ where: { nome: "Aguardando Cliente" } })
      await prisma.chamado.update({
        where: { id },
        data: {
          slaPausadoEm: new Date(),
          ...(colunaAguardando ? { colunaId: colunaAguardando.id } : {}),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("Erro ao responder chamado:", e)
    return NextResponse.json({ erro: e.message ?? "Erro interno" }, { status: 500 })
  }
}
