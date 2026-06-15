import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      cargo: "ADM" | "HC"
      status: "PENDENTE" | "ATIVO" | "INATIVO"
    } & DefaultSession["user"]
  }
}
