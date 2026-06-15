import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { PainelAdmin } from "@/componentes/admin/painel-admin"

export default async function PaginaAdmin({
  params,
}: {
  params: Promise<{ deptId: string }>
}) {
  const sessao = await auth()
  if (!sessao) redirect("/login")
  if (sessao.user.cargo !== "ADM") redirect("/painel")

  const { deptId } = await params

  const dept = await prisma.departamento.findFirst({ where: { id: deptId, ativo: true } })
  if (!dept) notFound()

  const [categorias, prioridades, colunas, usuarios, templates] = await Promise.all([
    prisma.categoria.findMany({ where: { departamentoId: deptId }, orderBy: { nome: "asc" } }),
    prisma.prioridade.findMany({ where: { departamentoId: deptId }, orderBy: { ordem: "asc" } }),
    prisma.colunaKanban.findMany({ where: { departamentoId: deptId }, orderBy: { ordem: "asc" } }),
    prisma.usuario.findMany({ orderBy: { nome: "asc" } }),
    prisma.templateEmail.findMany({ orderBy: { nome: "asc" } }),
  ])

  return (
    <PainelAdmin
      usuarioAtualId={sessao.user.id}
      departamentoId={deptId}
      departamentoNome={dept.nome}
      categoriasIniciais={JSON.parse(JSON.stringify(categorias))}
      prioridadesIniciais={JSON.parse(JSON.stringify(prioridades))}
      colunasIniciais={JSON.parse(JSON.stringify(colunas))}
      usuariosIniciais={JSON.parse(JSON.stringify(usuarios))}
      templatesIniciais={JSON.parse(JSON.stringify(templates))}
    />
  )
}
