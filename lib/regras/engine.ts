import { prisma } from "@/lib/prisma"
import { enviarEmail } from "@/lib/email/enviar"

export type GatilhoChamado = "CHAMADO_CRIADO" | "CHAMADO_RESOLVIDO"

type DadosChamado = {
  id: string
  assunto: string
  categoriaId: string | null
  prioridadeId: string | null
  departamentoId: string | null
  prazoSla: Date | null
  responsavel: { email: string; nome: string } | null
  mensagens: { deEmail: string; conteudoHtml: string }[]
  participantes: { cliente: { id: string; email: string; nome: string | null } }[]
}

export async function executarRegras(gatilho: GatilhoChamado, chamadoId: string) {
  const chamado = await prisma.chamado.findUnique({
    where: { id: chamadoId },
    select: {
      id: true,
      assunto: true,
      categoriaId: true,
      prioridadeId: true,
      departamentoId: true,
      prazoSla: true,
      responsavel: { select: { email: true, nome: true } },
      mensagens: {
        where: { direcao: "ENTRADA" },
        orderBy: { enviadoEm: "asc" },
        take: 1,
        select: { deEmail: true, conteudoHtml: true },
      },
      participantes: {
        where: { tipo: "PARA" },
        take: 3,
        include: { cliente: { select: { id: true, email: true, nome: true } } },
      },
    },
  })
  if (!chamado) return

  const regras = await prisma.autoRegra.findMany({
    where: {
      ativo: true,
      gatilho,
      OR: [
        { departamentoId: chamado.departamentoId },
        { departamentoId: null },
      ],
    },
    include: { condicoes: true, acoes: true },
    orderBy: { ordem: "asc" },
  })

  console.log(`[regras] ${regras.length} regra(s) ativa(s) para gatilho ${gatilho}, chamado ${chamadoId}`)

  for (const regra of regras) {
    const corresponde = avaliarCondicoes(regra.operador, regra.condicoes, chamado)
    if (!corresponde) {
      console.log(`[regras] Regra "${regra.nome}" — condições não batem, pulando`)
      continue
    }

    console.log(`[regras] Regra "${regra.nome}" — condições OK, executando ${regra.acoes.length} ação(ões)`)
    for (const acao of regra.acoes) {
      try {
        await executarAcao(acao.tipo, acao.valor, chamadoId, chamado)
        console.log(`[regras] Ação ${acao.tipo} executada (valor="${acao.valor}")`)
      } catch (e) {
        console.error(`[regras] Ação ${acao.tipo} falhou na regra "${regra.nome}":`, e)
      }
    }
  }
}

// ─── Avaliação de condições ───────────────────────────────────────────────────

function avaliarCondicoes(
  operador: string,
  condicoes: { campo: string; operador: string; valor: string }[],
  chamado: DadosChamado,
): boolean {
  if (condicoes.length === 0) return true
  const resultados = condicoes.map((c) => avaliarCondicao(c, chamado))
  return operador === "OU" ? resultados.some(Boolean) : resultados.every(Boolean)
}

function avaliarCondicao(
  condicao: { campo: string; operador: string; valor: string },
  chamado: DadosChamado,
): boolean {
  const deEmail = chamado.mensagens[0]?.deEmail ?? ""

  let valorCampo: string
  switch (condicao.campo) {
    case "assunto":
      valorCampo = chamado.assunto.toLowerCase()
      break
    case "deEmail":
      valorCampo = deEmail.toLowerCase()
      break
    case "dominio":
      valorCampo = deEmail.split("@")[1]?.toLowerCase() ?? ""
      break
    case "conteudo":
      valorCampo = (chamado.mensagens[0]?.conteudoHtml ?? "")
        .replace(/<[^>]+>/g, " ")
        .toLowerCase()
      break
    case "categoriaId":
      valorCampo = chamado.categoriaId ?? ""
      break
    case "prioridadeId":
      valorCampo = chamado.prioridadeId ?? ""
      break
    default:
      return false
  }

  const v = condicao.valor.toLowerCase()
  switch (condicao.operador) {
    case "contem":      return valorCampo.includes(v)
    case "nao_contem":  return !valorCampo.includes(v)
    case "igual":       return valorCampo === v || valorCampo === condicao.valor
    case "diferente":   return valorCampo !== v && valorCampo !== condicao.valor
    case "comeca_com":  return valorCampo.startsWith(v)
    case "termina_com": return valorCampo.endsWith(v)
    default:            return false
  }
}

// ─── Execução de ações ────────────────────────────────────────────────────────

async function executarAcao(
  tipo: string,
  valor: string,
  chamadoId: string,
  chamado: DadosChamado,
) {
  switch (tipo) {
    case "DEFINIR_CATEGORIA":
      await prisma.chamado.update({ where: { id: chamadoId }, data: { categoriaId: valor } })
      break

    case "DEFINIR_PRIORIDADE":
      await prisma.chamado.update({ where: { id: chamadoId }, data: { prioridadeId: valor } })
      break

    case "DEFINIR_COLUNA":
      await prisma.chamado.update({ where: { id: chamadoId }, data: { colunaId: valor } })
      break

    case "ATRIBUIR_USUARIO":
      await prisma.chamado.update({ where: { id: chamadoId }, data: { responsavelId: valor } })
      break

    case "ENVIAR_EMAIL": {
      const template = await prisma.templateEmail.findUnique({ where: { id: valor } })
      if (!template) break

      const cliente = chamado.participantes[0]?.cliente
      if (!cliente) break

      const assunto = substituirVariaveis(template.assunto, chamado)
      const conteudoHtml = substituirVariaveis(template.conteudoHtml, chamado)

      const resultado = await enviarEmail({ para: [cliente.email], assunto, conteudoHtml })

      await prisma.mensagemEmail.create({
        data: {
          chamadoId,
          deEmail: process.env.GMAIL_USUARIO ?? process.env.CAIXA_EMAIL_COMPARTILHADA ?? "",
          conteudoHtml,
          direcao: "SAIDA",
          messageId: resultado.messageId,
          graphMensagemId: resultado.graphMensagemId,
          destinatarios: {
            create: [{ email: cliente.email, nome: cliente.nome, tipo: "PARA" }],
          },
        },
      })
      break
    }

    case "NOTIFICAR_INTERNO": {
      const destinatarios = await resolverDestinatariosInternos(valor, chamado)
      if (destinatarios.length === 0) break

      const cliente = chamado.participantes[0]?.cliente
      const nomeCliente = cliente?.nome ?? cliente?.email ?? "—"
      const prazoSla = chamado.prazoSla
        ? new Date(chamado.prazoSla).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })
        : "—"

      await enviarEmail({
        para: destinatarios,
        assunto: `[Atendimento] ${chamado.assunto}`,
        conteudoHtml: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <p style="color:#374151;margin-bottom:16px">Aviso automático do sistema de atendimento:</p>
            <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
              <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:120px">Assunto</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;font-weight:600">${chamado.assunto}</td></tr>
              <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;font-size:13px">Cliente</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px">${nomeCliente}</td></tr>
              <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;font-size:13px">Prazo SLA</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px">${prazoSla}</td></tr>
            </table>
          </div>`,
      })
      break
    }
  }
}

async function resolverDestinatariosInternos(
  valor: string,
  chamado: DadosChamado,
): Promise<string[]> {
  if (valor === "responsavel") {
    return chamado.responsavel?.email ? [chamado.responsavel.email] : []
  }
  if (valor === "admins") {
    const admins = await prisma.usuario.findMany({
      where: { cargo: "ADM", status: "ATIVO" },
      select: { email: true },
    })
    return admins.map((a) => a.email)
  }
  if (valor.startsWith("user:")) {
    const userId = valor.slice(5)
    const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { email: true } })
    return user ? [user.email] : []
  }
  return []
}

function substituirVariaveis(texto: string, chamado: DadosChamado): string {
  const cliente = chamado.participantes[0]?.cliente
  const nomeCliente = cliente?.nome ?? cliente?.email ?? "Cliente"
  const prazoSla = chamado.prazoSla
    ? new Date(chamado.prazoSla).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—"

  return texto
    .replace(/\{\{assunto\}\}/g, chamado.assunto)
    .replace(/\{\{nome_cliente\}\}/g, nomeCliente)
    .replace(/\{\{email_cliente\}\}/g, cliente?.email ?? "")
    .replace(/\{\{prazo_sla\}\}/g, prazoSla)
}
