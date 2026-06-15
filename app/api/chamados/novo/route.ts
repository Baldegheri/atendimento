import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { enviarEmail } from "@/lib/email/enviar"
import { calcularPrazoSla } from "@/lib/sla"

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  try {
    const fd = await req.formData()
    const assunto = fd.get("assunto") as string
    const conteudoHtml = fd.get("conteudoHtml") as string
    const para = fd.getAll("para") as string[]
    const cc = fd.getAll("cc") as string[]
    const categoriaId = (fd.get("categoriaId") as string | null) || null
    const prioridadeId = (fd.get("prioridadeId") as string | null) || null
    const departamentoId = (fd.get("departamentoId") as string | null) || null

    if (!assunto || !conteudoHtml || para.length === 0) {
      return NextResponse.json({ erro: "Campos obrigatórios faltando" }, { status: 400 })
    }

    const [colunaInicial, prioridade, horarios] = await Promise.all([
      prisma.colunaKanban.findFirst({
        where: { padrao: true, ...(departamentoId ? { departamentoId } : {}) },
      }),
      prioridadeId ? prisma.prioridade.findUnique({ where: { id: prioridadeId } }) : null,
      prisma.horarioAtendimento.findMany({
        where: departamentoId ? { departamentoId } : undefined,
      }),
    ])

    if (!colunaInicial) {
      return NextResponse.json({ erro: "Nenhuma coluna padrão configurada" }, { status: 500 })
    }

    const resultado = await enviarEmail({
      para,
      cc: cc.length > 0 ? cc : undefined,
      assunto,
      conteudoHtml,
    })

    const agora = new Date()
    const prazoSla = prioridade ? calcularPrazoSla(agora, prioridade.horasSla, horarios) : null

    const [clientesPara, clientesCc] = await Promise.all([
      Promise.all(
        para.map((email) => prisma.cliente.upsert({ where: { email }, update: {}, create: { email } }))
      ),
      Promise.all(
        cc.map((email) => prisma.cliente.upsert({ where: { email }, update: {}, create: { email } }))
      ),
    ])

    const chamado = await prisma.chamado.create({
      data: {
        assunto,
        colunaId: colunaInicial.id,
        prioridadeId,
        categoriaId,
        departamentoId,
        origem: "INICIADO",
        prazoSla,
        mensagens: {
          create: {
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
        },
        participantes: {
          createMany: {
            data: [
              ...clientesPara.map((c) => ({
                clienteId: c.id,
                tipo: "PARA" as const,
                adicionadoPorId: sessao.user.id,
              })),
              ...clientesCc.map((c) => ({
                clienteId: c.id,
                tipo: "CC" as const,
                adicionadoPorId: sessao.user.id,
              })),
            ],
            skipDuplicates: true,
          },
        },
      },
    })

    return NextResponse.json({ id: chamado.id })
  } catch (e: any) {
    console.error("Erro ao criar chamado:", e)
    return NextResponse.json({ erro: e.message ?? "Erro interno" }, { status: 500 })
  }
}
