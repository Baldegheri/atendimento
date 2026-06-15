import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from "next-auth/adapters"
import { prisma } from "./prisma"

export function AdaptadorPrisma(): Adapter {
  return {
    async createUser(data) {
      const usuario = await prisma.usuario.create({
        data: {
          nome: data.name ?? "",
          email: data.email,
          imagem: data.image,
        },
      })
      return {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        emailVerified: null,
        image: usuario.imagem,
      }
    },

    async getUser(id) {
      const usuario = await prisma.usuario.findUnique({ where: { id } })
      if (!usuario) return null
      return {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        emailVerified: null,
        image: usuario.imagem,
      }
    },

    async getUserByEmail(email) {
      const usuario = await prisma.usuario.findUnique({ where: { email } })
      if (!usuario) return null
      return {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        emailVerified: null,
        image: usuario.imagem,
      }
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const conta = await prisma.conta.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { usuario: true },
      })
      if (!conta) return null
      const usuario = conta.usuario
      return {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        emailVerified: null,
        image: usuario.imagem,
      }
    },

    async updateUser(data) {
      const usuario = await prisma.usuario.update({
        where: { id: data.id },
        data: {
          nome: data.name ?? undefined,
          email: data.email ?? undefined,
          imagem: data.image ?? undefined,
        },
      })
      return {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        emailVerified: null,
        image: usuario.imagem,
      }
    },

    async deleteUser(id) {
      await prisma.usuario.delete({ where: { id } })
    },

    async linkAccount(data: AdapterAccount) {
      await prisma.conta.create({
        data: {
          usuarioId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state as string | undefined,
        },
      })
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.conta.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      })
    },

    async createSession(data: AdapterSession) {
      const sessao = await prisma.sessao.create({
        data: {
          sessionToken: data.sessionToken,
          usuarioId: data.userId,
          expires: data.expires,
        },
      })
      return {
        sessionToken: sessao.sessionToken,
        userId: sessao.usuarioId,
        expires: sessao.expires,
      }
    },

    async getSessionAndUser(sessionToken) {
      const sessao = await prisma.sessao.findUnique({
        where: { sessionToken },
        include: { usuario: true },
      })
      if (!sessao) return null
      return {
        session: {
          sessionToken: sessao.sessionToken,
          userId: sessao.usuarioId,
          expires: sessao.expires,
        },
        user: {
          id: sessao.usuario.id,
          name: sessao.usuario.nome,
          email: sessao.usuario.email,
          emailVerified: null,
          image: sessao.usuario.imagem,
        } as AdapterUser,
      }
    },

    async updateSession(data) {
      const sessao = await prisma.sessao.update({
        where: { sessionToken: data.sessionToken },
        data: { expires: data.expires },
      })
      return {
        sessionToken: sessao.sessionToken,
        userId: sessao.usuarioId,
        expires: sessao.expires,
      }
    },

    async deleteSession(sessionToken) {
      await prisma.sessao.delete({ where: { sessionToken } })
    },

    async createVerificationToken(data: VerificationToken) {
      const token = await prisma.tokenVerificacao.create({ data })
      return token
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const tokenEncontrado = await prisma.tokenVerificacao.delete({
          where: { identifier_token: { identifier, token } },
        })
        return tokenEncontrado
      } catch {
        return null
      }
    },
  }
}
