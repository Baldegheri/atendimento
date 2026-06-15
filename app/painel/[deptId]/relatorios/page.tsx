import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { RelatoriosDashboard } from "@/componentes/relatorios/relatorios-dashboard"

export default async function PaginaRelatorios({
  params,
}: {
  params: Promise<{ deptId: string }>
}) {
  const sessao = await auth()
  if (!sessao) redirect("/login")

  const { deptId } = await params

  const dept = await prisma.departamento.findFirst({ where: { id: deptId, ativo: true } })
  if (!dept) notFound()

  return <RelatoriosDashboard departamentoId={deptId} departamentoNome={dept.nome} />
}
