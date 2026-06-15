import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"
import type { MensagemLida } from "./graph"

function criarCliente() {
  return new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USUARIO!,
      pass: process.env.GMAIL_SENHA_APP!,
    },
    logger: false,
  })
}

function extrairThreadId(messageId: string | null, references: string | string[] | undefined): string {
  if (references) {
    const lista = Array.isArray(references) ? references : references.split(/\s+/)
    const primeira = lista[0]?.trim()
    if (primeira) return primeira
  }
  return messageId ?? crypto.randomUUID()
}

export async function lerEmailsNaoLidos(): Promise<MensagemLida[]> {
  const cliente = criarCliente()
  const mensagens: MensagemLida[] = []

  await cliente.connect()
  console.log("[gmail] Conectado ao IMAP")

  const lock = await cliente.getMailboxLock("INBOX")
  try {
    const seqNums = (await cliente.search({ seen: false })) as number[]
    console.log(`[gmail] Mensagens não lidas encontradas: ${seqNums.length}`)

    if (seqNums.length === 0) return mensagens

    // Coleta todos os raws primeiro — sem outros comandos IMAP durante o fetch
    const raws: { seq: number; source: Buffer }[] = []
    for await (const msg of cliente.fetch(seqNums, { source: true })) {
      if (msg.source) raws.push({ seq: msg.seq, source: msg.source as Buffer })
    }

    // Marca como lido após o loop de fetch terminar
    if (raws.length > 0) {
      await cliente.messageFlagsAdd(raws.map((r) => r.seq), ["\\Seen"])
    }

    // Parseia fora da conexão IMAP
    for (const raw of raws) {
      try {
        const parsed = await simpleParser(raw.source)

        const messageId = parsed.messageId ?? null
        const inReplyTo = parsed.inReplyTo ?? null
        const threadId = extrairThreadId(messageId, parsed.references)

        const para = (parsed.to ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]) : [])
          .flatMap((a) => a.value)
          .map((e) => ({ email: e.address?.toLowerCase() ?? "", nome: e.name ?? null }))

        const cc = (parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]) : [])
          .flatMap((a) => a.value)
          .map((e) => ({ email: e.address?.toLowerCase() ?? "", nome: e.name ?? null }))

        console.log(`[gmail] Parseado: "${parsed.subject}" de ${parsed.from?.value[0]?.address}`)

        mensagens.push({
          deEmail: parsed.from?.value[0]?.address?.toLowerCase() ?? "",
          deNome: parsed.from?.value[0]?.name ?? null,
          assunto: parsed.subject ?? "(sem assunto)",
          threadId,
          inReplyTo,
          messageId,
          graphMensagemId: String(raw.seq),
          conteudoHtml: parsed.html || parsed.textAsHtml || parsed.text || "",
          para,
          cc,
          dataRecebimento: parsed.date ?? new Date(),
        })
      } catch (err) {
        console.error("[gmail] Erro ao parsear mensagem:", err)
      }
    }
  } finally {
    lock.release()
  }

  try {
    await cliente.logout()
  } catch {
    // ignora erros de logout
  }

  return mensagens
}

export async function testarConexao(): Promise<boolean> {
  const cliente = criarCliente()
  try {
    await cliente.connect()
    const lock = await cliente.getMailboxLock("INBOX")
    lock.release()
    await cliente.logout()
    return true
  } catch (erro) {
    console.error("[gmail] Falha na conexão:", erro)
    return false
  }
}
