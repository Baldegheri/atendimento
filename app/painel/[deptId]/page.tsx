import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { QuadroKanban } from "@/componentes/kanban/quadro"
import { ListaChamados } from "@/componentes/lista/lista-chamados"
import { ToggleTema } from "@/componentes/toggle-tema"

async function verificarAcesso(usuarioId: string, cargo: string, deptId: string) {
  if (cargo === "ADM") {
    return prisma.departamento.findFirst({ where: { id: deptId, ativo: true } })
  }
  const membro = await prisma.membroDepartamento.findUnique({
    where: { usuarioId_departamentoId: { usuarioId, departamentoId: deptId } },
    include: { departamento: true },
  })
  return membro?.departamento ?? null
}

async function buscarDados(usuarioId: string, deptId: string) {
  const [colunas, categorias, prioridades, assinatura] = await Promise.all([
    prisma.colunaKanban.findMany({
      where: { departamentoId: deptId },
      orderBy: { ordem: "asc" },
      include: {
        chamados: {
          where: { departamentoId: deptId },
          include: {
            prioridade: { select: { nome: true, cor: true } },
            categoria: { select: { nome: true } },
            responsavel: { select: { nome: true, imagem: true } },
            participantes: {
              where: { removidoEm: null, tipo: "PARA" },
              include: { cliente: { select: { email: true, nome: true } } },
              take: 1,
            },
          },
          orderBy: { criadoEm: "desc" },
        },
      },
    }),
    prisma.categoria.findMany({
      where: { departamentoId: deptId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.prioridade.findMany({
      where: { departamentoId: deptId },
      select: { id: true, nome: true, cor: true },
      orderBy: { ordem: "asc" },
    }),
    prisma.assinaturaEmail.findFirst({
      where: { usuarioId },
      orderBy: [{ padrao: "desc" }, { criadoEm: "asc" }],
      select: { conteudoHtml: true },
    }),
  ])
  return { colunas, categorias, prioridades, assinatura: assinatura?.conteudoHtml ?? null }
}

export default async function PaginaPainel({
  params,
  searchParams,
}: {
  params: Promise<{ deptId: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const sessao = await auth()
  if (!sessao) redirect("/login")
  if (sessao.user.status === "PENDENTE") redirect("/aguardando-aprovacao")

  const { deptId } = await params
  const { view } = await searchParams

  const dept = await verificarAcesso(sessao.user.id, sessao.user.cargo, deptId)
  if (!dept) notFound()

  const visaoLista = view === "lista"
  const { colunas, categorias, prioridades, assinatura } = await buscarDados(sessao.user.id, deptId)
  const colunasSerializadas = JSON.parse(JSON.stringify(colunas))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/painel"
            className="flex items-center gap-2.5 group"
            title="Trocar departamento"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:opacity-80 transition-opacity"
              style={{ backgroundColor: dept.cor }}
            >
              <span className="text-white text-sm font-bold">
                {dept.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
              {dept.nome}
            </span>
            <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {sessao.user.cargo === "ADM" && (
            <a
              href={`/painel/${deptId}/admin`}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Admin
            </a>
          )}
          <a
            href={`/painel/${deptId}/relatorios`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            Relatórios
          </a>
          <ToggleTema />
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sessao.user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sessao.user.cargo}</p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="max-w-full mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Painel de Atendimento</h1>

            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
              <Link
                href={`/painel/${deptId}`}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
                  !visaoLista
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Kanban
              </Link>
              <Link
                href={`/painel/${deptId}?view=lista`}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
                  visaoLista
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Lista
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {visaoLista ? (
              <ListaChamados
                colunas={colunasSerializadas}
                usuarioId={sessao.user.id}
                departamentoId={deptId}
              />
            ) : (
              <QuadroKanban
                colunasIniciais={colunasSerializadas}
                categorias={categorias}
                prioridades={prioridades}
                assinatura={assinatura}
                usuarioId={sessao.user.id}
                departamentoId={deptId}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
