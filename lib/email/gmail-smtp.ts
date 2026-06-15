import nodemailer from "nodemailer"
import type { OpcaoEnvio, ResultadoEnvio } from "./graph"

function criarTransporte() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USUARIO!,
      pass: process.env.GMAIL_SENHA_APP!,
    },
  })
}

export async function enviarEmail(opcoes: OpcaoEnvio): Promise<ResultadoEnvio> {
  const transporte = criarTransporte()

  const info = await transporte.sendMail({
    from: `"Atendimento AG Capital" <${process.env.GMAIL_USUARIO}>`,
    to: opcoes.para.join(", "),
    cc: opcoes.cc && opcoes.cc.length > 0 ? opcoes.cc.join(", ") : undefined,
    subject: opcoes.assunto,
    html: opcoes.conteudoHtml,
    ...(opcoes.inReplyToMessageId
      ? {
          inReplyTo: opcoes.inReplyToMessageId,
          references: opcoes.inReplyToMessageId,
        }
      : {}),
    attachments: (opcoes.anexos ?? []).map((a) => ({
      filename: a.nome,
      content: a.conteudo,
      contentType: a.tipo,
    })),
  })

  return {
    messageId: info.messageId ?? null,
    graphMensagemId: null,
    conversationId: null,
  }
}
