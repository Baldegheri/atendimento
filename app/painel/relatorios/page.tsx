import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { RelatoriosDashboard } from "@/componentes/relatorios/relatorios-dashboard"

export default async function PaginaRelatorios() {
  const sessao = await auth()
  if (!sessao) redirect("/login")
  if (sessao.user.status === "PENDENTE") redirect("/aguardando-aprovacao")

  return <RelatoriosDashboard />
}
