import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function PaginaInicial() {
  const sessao = await auth()

  if (!sessao) redirect("/login")
  if (sessao.user.status === "PENDENTE") redirect("/aguardando-aprovacao")

  redirect("/painel")
}
