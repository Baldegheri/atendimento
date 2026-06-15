import { lerEmailsNaoLidos } from "./imap"
import { prisma } from "@/lib/prisma"
import { calcularPrazoSla, calcularHorasUteisEntre } from "@/lib/sla"
import { executarRegras } from "@/lib/regras/engine"

export async function sincronizarEmails() {
  console.log("[email] Verificando novos e-mails...")

  const mensagens = await lerEmailsNaoLidos()
  if (mensagens.length === 0) {
    console.log("[email] Nenhum e-mail novo")
    return
  }

  console.log(`[email] ${mensagens.length} e-mail(s) novo(s)`)

  for (const mensagem of mensagens) {
    try {
      await processarMensagem(mensagem)
    } catch (erro) {
      console.error("[email] Erro ao processar mensagem:", erro)
    }
  }
}

async function processarMensagem(mensagem: Awaited<ReturnType<typeof lerEmailsNaoLidos>>[number]) {
  console.log(`[email] Processando: de=${mensagem.deEmail} assunto="${mensagem.assunto}"`)
  console.log(`[email] threadId=${mensagem.threadId} inReplyTo=${mensagem.inReplyTo ?? "null"} messageId=${mensagem.messageId ?? "null"}`)

  let chamadoExistente = await prisma.chamado.findFirst({
    where: { threadId: mensagem.threadId },
    select: { id: true, colunaId: true, departamentoId: true },
  })

  if (chamadoExistente) {
    console.log(`[email] Chamado encontrado por threadId: ${chamadoExistente.id}`)
  }

  // Fallback: procura pelo inReplyTo nas mensagens enviadas pelo atendimento
  if (!chamadoExistente && mensagem.inReplyTo) {
    console.log(`[email] Tentando fallback por inReplyTo: ${mensagem.inReplyTo}`)
    const msgOrigem = await prisma.mensagemEmail.findFirst({
      where: { messageId: mensagem.inReplyTo },
      select: { chamadoId: true },
    })
    if (msgOrigem) {
      chamadoExistente = await prisma.chamado.findUnique({
        where: { id: msgOrigem.chamadoId },
        select: { id: true, colunaId: true, departamentoId: true },
      })
      if (chamadoExistente) console.log(`[email] Chamado encontrado por fallback: ${chamadoExistente.id}`)
    } else {
      console.log(`[email] Fallback: nenhuma mensagem com esse messageId`)
    }
  }

  if (chamadoExistente) {
    const inserido = await adicionarMensagem(chamadoExistente.id, mensagem)
    if (inserido) {
      await moverSeAguardando(chamadoExistente)
      console.log(`[email] Mensagem inserida no chamado ${chamadoExistente.id}`)
    } else {
      console.log(`[email] Mensagem duplicada, ignorada (chamado ${chamadoExistente.id})`)
    }
  } else {
    await criarNovoChamado(mensagem)
    console.log(`[email] Novo chamado criado: ${mensagem.assunto}`)
  }
}

async function moverSeAguardando(chamado: { id: string; colunaId: string; departamentoId: string | null }) {
  const deptWhere = chamado.departamentoId ? { departamentoId: chamado.departamentoId } : {}
  const [colunaAguardando, colunaAtribuido] = await Promise.all([
    prisma.colunaKanban.findFirst({ where: { nome: "Aguardando Cliente", ...deptWhere }, select: { id: true } }),
    prisma.colunaKanban.findFirst({ where: { nome: "Atribuído", ...deptWhere }, select: { id: true } }),
  ])

  if (colunaAguardando && colunaAtribuido && chamado.colunaId === colunaAguardando.id) {
    // Retomar SLA: estender prazoSla pelas horas úteis que ficou pausado
    const dadosChamado = await prisma.chamado.findUnique({
      where: { id: chamado.id },
      select: { prazoSla: true, slaPausadoEm: true },
    })

    let novoPrazoSla: Date | null | undefined = undefined
    if (dadosChamado?.prazoSla && dadosChamado?.slaPausadoEm) {
      const horarios = await prisma.horarioAtendimento.findMany({
        where: chamado.departamentoId ? { departamentoId: chamado.departamentoId } : {},
        orderBy: { diaSemana: "asc" },
      })
      const horasPausadas = calcularHorasUteisEntre(dadosChamado.slaPausadoEm, new Date(), horarios)
      novoPrazoSla = calcularPrazoSla(dadosChamado.prazoSla, horasPausadas, horarios)
      console.log(`[email] SLA retomado — ${horasPausadas.toFixed(2)}h úteis pausadas, novo prazo: ${novoPrazoSla.toISOString()}`)
    }

    await prisma.chamado.update({
      where: { id: chamado.id },
      data: {
        colunaId: colunaAtribuido.id,
        slaPausadoEm: null,
        ...(novoPrazoSla !== undefined ? { prazoSla: novoPrazoSla } : {}),
      },
    })
    console.log(`[email] Chamado movido de Aguardando Cliente para Atribuído`)
  }
}

async function criarNovoChamado(mensagem: Awaited<ReturnType<typeof lerEmailsNaoLidos>>[number]) {
  const clienteRemetente = await prisma.cliente.upsert({
    where: { email: mensagem.deEmail },
    update: mensagem.deNome ? { nome: mensagem.deNome } : {},
    create: { email: mensagem.deEmail, nome: mensagem.deNome },
  })

  const colunaInicial = await prisma.colunaKanban.findFirst({
    where: { padrao: true },
    orderBy: { ordem: "asc" },
  })
  if (!colunaInicial) {
    console.error("[email] Nenhuma coluna padrão encontrada — chamado não criado")
    return
  }

  const deptId = colunaInicial.departamentoId

  const [prioridadeNormal, horarios] = await Promise.all([
    prisma.prioridade.findFirst({
      where: { nome: "Normal", ...(deptId ? { departamentoId: deptId } : {}) },
      select: { id: true, horasSla: true },
    }),
    prisma.horarioAtendimento.findMany({
      where: deptId ? { departamentoId: deptId } : {},
      orderBy: { diaSemana: "asc" },
    }),
  ])

  const prazoSla = prioridadeNormal
    ? calcularPrazoSla(new Date(), prioridadeNormal.horasSla, horarios)
    : null

  const chamado = await prisma.chamado.create({
    data: {
      assunto: mensagem.assunto,
      threadId: mensagem.threadId,
      colunaId: colunaInicial.id,
      departamentoId: deptId,
      prioridadeId: prioridadeNormal?.id,
      origem: "RECEBIDO",
      prazoSla,
    },
  })

  await prisma.participanteChamado.create({
    data: { chamadoId: chamado.id, clienteId: clienteRemetente.id, tipo: "PARA" },
  })

  const caixaEmail = process.env.CAIXA_EMAIL_COMPARTILHADA!
  for (const dest of mensagem.para) {
    if (dest.email === caixaEmail) continue
    const clienteDest = await prisma.cliente.upsert({
      where: { email: dest.email },
      update: dest.nome ? { nome: dest.nome } : {},
      create: { email: dest.email, nome: dest.nome },
    })
    await prisma.participanteChamado.createMany({
      data: [{ chamadoId: chamado.id, clienteId: clienteDest.id, tipo: "PARA" }],
      skipDuplicates: true,
    })
  }

  await adicionarMensagem(chamado.id, mensagem)

  executarRegras("CHAMADO_CRIADO", chamado.id).catch((e) =>
    console.error("[sincronizar] Erro ao executar regras:", e),
  )
}

async function adicionarMensagem(
  chamadoId: string,
  mensagem: Awaited<ReturnType<typeof lerEmailsNaoLidos>>[number]
): Promise<boolean> {
  const jaExiste = mensagem.messageId
    ? await prisma.mensagemEmail.findFirst({ where: { messageId: mensagem.messageId } })
    : await prisma.mensagemEmail.findFirst({ where: { chamadoId, deEmail: mensagem.deEmail, enviadoEm: mensagem.dataRecebimento } })
  if (jaExiste) return false

  await prisma.mensagemEmail.create({
    data: {
      chamadoId,
      deEmail: mensagem.deEmail,
      deNome: mensagem.deNome,
      conteudoHtml: mensagem.conteudoHtml,
      direcao: "ENTRADA",
      enviadoEm: mensagem.dataRecebimento,
      messageId: mensagem.messageId ?? null,
      graphMensagemId: mensagem.graphMensagemId,
      destinatarios: {
        create: [
          ...mensagem.para.map((d) => ({ email: d.email, nome: d.nome, tipo: "PARA" as const })),
          ...mensagem.cc.map((d) => ({ email: d.email, nome: d.nome, tipo: "CC" as const })),
        ],
      },
    },
  })
  return true
}
