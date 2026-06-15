import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SeletorDepartamento } from "@/componentes/departamento/seletor-departamento"

export default async function PaginaSeletor() {
  const sessao = await auth()
  if (!sessao) redirect("/login")
  if (sessao.user.status === "PENDENTE") redirect("/aguardando-aprovacao")

  const isAdm = sessao.user.cargo === "ADM"

  const depts = isAdm
    ? await prisma.departamento.findMany({
        where: { ativo: true },
        include: { _count: { select: { chamados: true, membros: true } } },
        orderBy: { nome: "asc" },
      })
    : await prisma.departamento.findMany({
        where: { ativo: true, membros: { some: { usuarioId: sessao.user.id } } },
        include: { _count: { select: { chamados: true, membros: true } } },
        orderBy: { nome: "asc" },
      })

  return (
    <SeletorDepartamento
      departamentos={JSON.parse(JSON.stringify(depts))}
      isAdm={isAdm}
      usuarioId={sessao.user.id}
      usuarioNome={sessao.user.name ?? ""}
      usuarioCargo={sessao.user.cargo}
    />
  )
}
