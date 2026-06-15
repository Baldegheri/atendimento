import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const periodo = Math.min(Math.max(Number(sp.get("periodo") ?? "30"), 1), 365)
  const responsavelId = sp.get("responsavelId") || undefined
  const categoriaId = sp.get("categoriaId") || undefined
  const prioridadeId = sp.get("prioridadeId") || undefined
  const deptId = sp.get("deptId") || undefined

  const periodoInicio = new Date()
  periodoInicio.setDate(periodoInicio.getDate() - periodo)
  periodoInicio.setHours(0, 0, 0, 0)

  const agora = new Date()

  const chamados = await prisma.chamado.findMany({
    where: {
      criadoEm: { gte: periodoInicio },
      ...(deptId ? { departamentoId: deptId } : {}),
      ...(responsavelId ? { responsavelId } : {}),
      ...(categoriaId ? { categoriaId } : {}),
      ...(prioridadeId ? { prioridadeId } : {}),
    },
    select: {
      id: true,
      assunto: true,
      criadoEm: true,
      resolvidoEm: true,
      prazoSla: true,
      responsavelId: true,
      origem: true,
      responsavel: { select: { nome: true } },
      categoria: { select: { nome: true } },
      prioridade: { select: { nome: true, cor: true } },
      mensagens: {
        where: { direcao: "SAIDA" },
        orderBy: { enviadoEm: "asc" },
        take: 1,
        select: { enviadoEm: true },
      },
    },
    orderBy: { criadoEm: "asc" },
  })

  const total = chamados.length
  const abertos = chamados.filter((c) => !c.resolvidoEm && !c.responsavelId).length
  const emAndamento = chamados.filter((c) => !c.resolvidoEm && !!c.responsavelId).length
  const resolvidos = chamados.filter((c) => !!c.resolvidoEm).length
  const slaVencido = chamados.filter((c) => c.prazoSla && !c.resolvidoEm && c.prazoSla < agora).length

  const respostas = chamados
    .filter((c) => c.mensagens.length > 0)
    .map((c) => (c.mensagens[0].enviadoEm.getTime() - c.criadoEm.getTime()) / 3_600_000)
  const tempoMedioResposta =
    respostas.length > 0
      ? Math.round((respostas.reduce((a, b) => a + b, 0) / respostas.length) * 10) / 10
      : null

  const resolucoes = chamados
    .filter((c) => !!c.resolvidoEm)
    .map((c) => (c.resolvidoEm!.getTime() - c.criadoEm.getTime()) / 3_600_000)
  const tempoMedioResolucao =
    resolucoes.length > 0
      ? Math.round((resolucoes.reduce((a, b) => a + b, 0) / resolucoes.length) * 10) / 10
      : null

  const comSla = chamados.filter((c) => c.resolvidoEm && c.prazoSla)
  const dentroDeSla = comSla.filter((c) => c.resolvidoEm! <= c.prazoSla!)
  const taxaSla = comSla.length > 0 ? Math.round((dentroDeSla.length / comSla.length) * 100) : null

  // Volume por dia: generate all days in range
  const diasMap = new Map<string, { recebidos: number; iniciados: number }>()
  for (let i = 0; i <= periodo; i++) {
    const d = new Date(periodoInicio)
    d.setDate(d.getDate() + i)
    diasMap.set(d.toISOString().slice(0, 10), { recebidos: 0, iniciados: 0 })
  }
  for (const c of chamados) {
    const key = c.criadoEm.toISOString().slice(0, 10)
    const entry = diasMap.get(key)
    if (entry) {
      if (c.origem === "RECEBIDO") entry.recebidos++
      else entry.iniciados++
    }
  }
  const volumePorDia = Array.from(diasMap.entries()).map(([data, v]) => ({
    data,
    total: v.recebidos + v.iniciados,
    recebidos: v.recebidos,
    iniciados: v.iniciados,
  }))

  const operadorMap = new Map<string, { nome: string; total: number; resolvidos: number }>()
  for (const c of chamados) {
    if (!c.responsavel) continue
    const nome = c.responsavel.nome
    if (!operadorMap.has(nome)) operadorMap.set(nome, { nome, total: 0, resolvidos: 0 })
    const e = operadorMap.get(nome)!
    e.total++
    if (c.resolvidoEm) e.resolvidos++
  }
  const porOperador = Array.from(operadorMap.values()).sort((a, b) => b.total - a.total)

  const categoriaMap = new Map<string, { nome: string; total: number }>()
  for (const c of chamados) {
    if (!c.categoria) continue
    const nome = c.categoria.nome
    if (!categoriaMap.has(nome)) categoriaMap.set(nome, { nome, total: 0 })
    categoriaMap.get(nome)!.total++
  }
  const porCategoria = Array.from(categoriaMap.values()).sort((a, b) => b.total - a.total)

  const prioridadeMap = new Map<string, { nome: string; cor: string; total: number }>()
  for (const c of chamados) {
    if (!c.prioridade) continue
    const { nome, cor } = c.prioridade
    if (!prioridadeMap.has(nome)) prioridadeMap.set(nome, { nome, cor, total: 0 })
    prioridadeMap.get(nome)!.total++
  }
  const porPrioridade = Array.from(prioridadeMap.values()).sort((a, b) => b.total - a.total)

  const slaVencidosDetalhe = chamados
    .filter((c) => c.prazoSla && !c.resolvidoEm && c.prazoSla < agora)
    .sort((a, b) => a.prazoSla!.getTime() - b.prazoSla!.getTime())
    .map((c) => ({
      id: c.id,
      assunto: c.assunto,
      prazoSla: c.prazoSla!.toISOString(),
      responsavel: c.responsavel?.nome ?? null,
      categoria: c.categoria?.nome ?? null,
    }))

  const [usuarios, categorias, prioridades] = await Promise.all([
    prisma.usuario.findMany({
      where: { status: "ATIVO" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.categoria.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.prioridade.findMany({
      select: { id: true, nome: true, cor: true },
      orderBy: { ordem: "asc" },
    }),
  ])

  return NextResponse.json({
    resumo: { total, abertos, emAndamento, resolvidos, slaVencido },
    tempoMedioResposta,
    tempoMedioResolucao,
    taxaSla,
    volumePorDia,
    porOperador,
    porCategoria,
    porPrioridade,
    slaVencidosDetalhe,
    filtros: { usuarios, categorias, prioridades },
  })
}
