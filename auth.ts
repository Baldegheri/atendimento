import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { AdaptadorPrisma } from "./lib/adaptador-auth"
import { prisma } from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: AdaptadorPrisma(),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.email) {
        const usuario = await prisma.usuario.findUnique({
          where: { email: user.email },
          select: { id: true, cargo: true, status: true },
        })
        token.id = usuario?.id ?? user.id
        token.cargo = usuario?.cargo ?? "HC"
        token.status = usuario?.status ?? "PENDENTE"
      }
      return token
    },
    async signIn({ user }) {
      if (!user.email) return false
      const usuario = await prisma.usuario.findUnique({
        where: { email: user.email },
      })
      if (!usuario) return true
      if (usuario.status === "ATIVO") return true
      return "/aguardando-aprovacao"
    },
  },
})
