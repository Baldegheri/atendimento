import { prisma } from "@/lib/prisma"

const urlToken = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`

const escopos = [
  "https://graph.microsoft.com/Mail.Read",
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "offline_access",
].join(" ")

export async function obterTokenValido(): Promise<string | null> {
  const config = await prisma.configuracaoEmail.findFirst()
  if (!config) return null

  const agora = new Date()
  const bufferMs = 5 * 60 * 1000

  if (config.expiresAt.getTime() - agora.getTime() > bufferMs) {
    return config.accessToken
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
      scope: escopos,
    })

    const resposta = await fetch(urlToken, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    const dados = await resposta.json()
    if (!dados.access_token) return null

    const novaExpiracao = new Date(Date.now() + dados.expires_in * 1000)

    await prisma.configuracaoEmail.update({
      where: { id: config.id },
      data: {
        accessToken: dados.access_token,
        refreshToken: dados.refresh_token ?? config.refreshToken,
        expiresAt: novaExpiracao,
      },
    })

    return dados.access_token
  } catch (erro) {
    console.error("Erro ao renovar token:", erro)
    return null
  }
}

export async function salvarTokens(dados: {
  accessToken: string
  refreshToken: string
  expiresIn: number
  caixaEmail: string
}) {
  const expiresAt = new Date(Date.now() + dados.expiresIn * 1000)

  await prisma.configuracaoEmail.upsert({
    where: { id: "singleton" },
    update: {
      accessToken: dados.accessToken,
      refreshToken: dados.refreshToken,
      expiresAt,
      caixaEmail: dados.caixaEmail,
    },
    create: {
      id: "singleton",
      accessToken: dados.accessToken,
      refreshToken: dados.refreshToken,
      expiresAt,
      caixaEmail: dados.caixaEmail,
    },
  })
}

export async function verificarConexao(): Promise<boolean> {
  const config = await prisma.configuracaoEmail.findFirst()
  return !!config
}
