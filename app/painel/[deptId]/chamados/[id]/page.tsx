import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { DetalheChamado } from "@/componentes/chamado/detalhe-chamado"

export default async function PaginaChamado({
  params,
}: {
  params: Promise<{ deptId: string; id: string }>
}) {
  const sessao = await auth()
  if (!sessao) redirect("/login")
  if (sessao.user.status === "PENDENTE") redirect("/aguardando-aprovacao")

  const { id } = await params

  const [chamado, assinatura] = await Promise.all([
    prisma.chamado.findUnique({
      where: { id },
      include: {
        coluna: { select: { nome: true, cor: true } },
        prioridade: { select: { nome: true, cor: true } },
        categoria: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true, email: true, imagem: true } },
        participantes: {
          where: { removidoEm: null },
          include: { cliente: { select: { id: true, email: true, nome: true } } },
        },
        mensagens: {
          include: {
            destinatarios: { select: { id: true, email: true, nome: true, tipo: true } },
          },
          orderBy: { enviadoEm: "asc" },
        },
      },
    }),
    prisma.assinaturaEmail.findFirst({
      where: { usuarioId: sessao.user.id },
      orderBy: [{ padrao: "desc" }, { criadoEm: "asc" }],
      select: { conteudoHtml: true },
    }),
  ])

  if (!chamado) notFound()

  return (
    <DetalheChamado
      chamado={JSON.parse(JSON.stringify(chamado))}
      usuarioId={sessao.user.id}
      usuarioNome={sessao.user.name ?? ""}
      assinatura={assinatura?.conteudoHtml ?? null}
    />
  )
}
