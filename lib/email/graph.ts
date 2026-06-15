import { Client } from "@microsoft/microsoft-graph-client"
import { ConfidentialClientApplication } from "@azure/msal-node"

const msalApp = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
  },
})

async function obterToken(): Promise<string> {
  const resultado = await msalApp.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  })
  if (!resultado?.accessToken) throw new Error("Falha ao obter token Microsoft Graph")
  return resultado.accessToken
}

function criarCliente(token: string) {
  return Client.init({ authProvider: (done) => done(null, token) })
}

export type MensagemLida = {
  deEmail: string
  deNome: string | null
  assunto: string
  threadId: string
  inReplyTo: string | null
  messageId: string | null
  graphMensagemId: string
  conteudoHtml: string
  para: { email: string; nome: string | null }[]
  cc: { email: string; nome: string | null }[]
  dataRecebimento: Date
}

export async function lerEmailsNaoLidos(): Promise<MensagemLida[]> {
  const token = await obterToken()
  const cliente = criarCliente(token)
  const caixa = process.env.CAIXA_EMAIL_COMPARTILHADA!

  const resposta = await cliente
    .api(`/users/${caixa}/messages`)
    .filter("isRead eq false")
    .select(
      "id,subject,from,toRecipients,ccRecipients,body,conversationId,internetMessageId,receivedDateTime,internetMessageHeaders"
    )
    .orderby("receivedDateTime asc")
    .top(50)
    .get()

  const mensagens: MensagemLida[] = []

  for (const msg of resposta.value ?? []) {
    await cliente
      .api(`/users/${caixa}/messages/${msg.id}`)
      .patch({ isRead: true })
      .catch(() => {})

    const cabecalhos: { name: string; value: string }[] = msg.internetMessageHeaders ?? []
    const inReplyTo = cabecalhos.find((h) => h.name.toLowerCase() === "in-reply-to")?.value ?? null

    mensagens.push({
      deEmail: msg.from?.emailAddress?.address?.toLowerCase() ?? "",
      deNome: msg.from?.emailAddress?.name ?? null,
      assunto: msg.subject ?? "(sem assunto)",
      threadId: msg.conversationId ?? msg.id,
      inReplyTo,
      messageId: msg.internetMessageId ?? null,
      graphMensagemId: msg.id,
      conteudoHtml: msg.body?.content ?? "",
      para: (msg.toRecipients ?? []).map((r: any) => ({
        email: r.emailAddress.address?.toLowerCase() ?? "",
        nome: r.emailAddress.name ?? null,
      })),
      cc: (msg.ccRecipients ?? []).map((r: any) => ({
        email: r.emailAddress.address?.toLowerCase() ?? "",
        nome: r.emailAddress.name ?? null,
      })),
      dataRecebimento: new Date(msg.receivedDateTime),
    })
  }

  return mensagens
}

export type OpcaoEnvio = {
  para: string[]
  cc?: string[]
  assunto: string
  conteudoHtml: string
  graphMensagemIdResposta?: string
  inReplyToMessageId?: string
  anexos?: { nome: string; conteudo: Buffer; tipo: string }[]
}

export type ResultadoEnvio = {
  messageId: string | null
  graphMensagemId: string | null
  conversationId: string | null
}

export async function enviarEmail(opcoes: OpcaoEnvio): Promise<ResultadoEnvio> {
  const token = await obterToken()
  const cliente = criarCliente(token)
  const caixa = process.env.CAIXA_EMAIL_COMPARTILHADA!

  const anexosGraph = (opcoes.anexos ?? []).map((a) => ({
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: a.nome,
    contentType: a.tipo,
    contentBytes: a.conteudo.toString("base64"),
  }))

  let rascunhoId: string
  let conversationId: string | null = null
  let messageId: string | null = null

  if (opcoes.graphMensagemIdResposta) {
    // Cria rascunho de resposta vinculado ao thread do Outlook
    const rascunho = await cliente
      .api(`/users/${caixa}/messages/${opcoes.graphMensagemIdResposta}/createReply`)
      .post({})

    rascunhoId = rascunho.id
    conversationId = rascunho.conversationId ?? null
    messageId = rascunho.internetMessageId ?? null

    await cliente.api(`/users/${caixa}/messages/${rascunhoId}`).patch({
      body: { contentType: "html", content: opcoes.conteudoHtml },
      toRecipients: opcoes.para.map((e) => ({ emailAddress: { address: e } })),
      ccRecipients: (opcoes.cc ?? []).map((e) => ({ emailAddress: { address: e } })),
      ...(anexosGraph.length ? { attachments: anexosGraph } : {}),
    })
  } else {
    // Cria rascunho de nova mensagem
    const rascunho = await cliente.api(`/users/${caixa}/messages`).post({
      subject: opcoes.assunto,
      body: { contentType: "html", content: opcoes.conteudoHtml },
      toRecipients: opcoes.para.map((e) => ({ emailAddress: { address: e } })),
      ccRecipients: (opcoes.cc ?? []).map((e) => ({ emailAddress: { address: e } })),
      ...(anexosGraph.length ? { attachments: anexosGraph } : {}),
    })

    rascunhoId = rascunho.id
    conversationId = rascunho.conversationId ?? null
    messageId = rascunho.internetMessageId ?? null
  }

  await cliente.api(`/users/${caixa}/messages/${rascunhoId}/send`).post({})

  return { messageId, graphMensagemId: rascunhoId, conversationId }
}

export async function testarConexao(): Promise<boolean> {
  try {
    const token = await obterToken()
    const cliente = criarCliente(token)
    const caixa = process.env.CAIXA_EMAIL_COMPARTILHADA!
    await cliente.api(`/users/${caixa}/messages`).top(1).get()
    return true
  } catch {
    return false
  }
}
