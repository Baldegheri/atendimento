"use client"

import { useState, useEffect } from "react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Condicao = { id?: string; campo: string; operador: string; valor: string }
type Acao = { id?: string; tipo: string; valor: string }

type AutoRegra = {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  ordem: number
  gatilho: string
  operador: string
  condicoes: Condicao[]
  acoes: Acao[]
}

type Categoria = { id: string; nome: string }
type Prioridade = { id: string; nome: string; cor: string }
type Coluna = { id: string; nome: string }
type Usuario = { id: string; nome: string }
type Template = { id: string; nome: string; assunto: string }

// ─── Constantes ───────────────────────────────────────────────────────────────

const GATILHOS = [
  { value: "CHAMADO_CRIADO", label: "Chamado criado", cor: "bg-blue-100 text-blue-700" },
  { value: "CHAMADO_RESOLVIDO", label: "Chamado resolvido", cor: "bg-green-100 text-green-700" },
]

const CAMPOS = [
  { value: "assunto", label: "Assunto do e-mail", tipo: "texto" },
  { value: "deEmail", label: "E-mail do remetente", tipo: "texto" },
  { value: "dominio", label: "Domínio do remetente", tipo: "texto" },
  { value: "conteudo", label: "Corpo do e-mail", tipo: "texto" },
  { value: "categoriaId", label: "Categoria atual", tipo: "id" },
  { value: "prioridadeId", label: "Prioridade atual", tipo: "id" },
]

const OPERADORES_TEXTO = [
  { value: "contem", label: "contém" },
  { value: "nao_contem", label: "não contém" },
  { value: "igual", label: "é igual a" },
  { value: "diferente", label: "é diferente de" },
  { value: "comeca_com", label: "começa com" },
  { value: "termina_com", label: "termina com" },
]

const OPERADORES_ID = [
  { value: "igual", label: "é" },
  { value: "diferente", label: "não é" },
]

const TIPOS_ACAO = [
  { value: "DEFINIR_CATEGORIA", label: "Definir categoria" },
  { value: "DEFINIR_PRIORIDADE", label: "Definir prioridade" },
  { value: "DEFINIR_COLUNA", label: "Mover para coluna" },
  { value: "ATRIBUIR_USUARIO", label: "Atribuir responsável" },
  { value: "ENVIAR_EMAIL", label: "Enviar e-mail automático" },
  { value: "NOTIFICAR_INTERNO", label: "Notificar internamente" },
]

const NOTIFICAR_OPCOES_FIXAS = [
  { value: "responsavel", label: "Responsável do chamado" },
  { value: "admins", label: "Todos os administradores" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelGatilho(g: string) {
  return GATILHOS.find((x) => x.value === g)?.label ?? g
}
function corGatilho(g: string) {
  return GATILHOS.find((x) => x.value === g)?.cor ?? "bg-gray-100 text-gray-600"
}
function tipoCampo(campo: string) {
  return CAMPOS.find((c) => c.value === campo)?.tipo ?? "texto"
}

// ─── Modal de criação/edição ──────────────────────────────────────────────────

function ModalRegra({
  regra,
  departamentoId,
  categorias,
  prioridades,
  colunas,
  usuarios,
  templates,
  onSalvar,
  onFechar,
}: {
  regra: AutoRegra | "nova"
  departamentoId: string
  categorias: Categoria[]
  prioridades: Prioridade[]
  colunas: Coluna[]
  usuarios: Usuario[]
  templates: Template[]
  onSalvar: (dados: Omit<AutoRegra, "id" | "ordem">) => Promise<void>
  onFechar: () => void
}) {
  const isNova = regra === "nova"
  const [salvando, setSalvando] = useState(false)
  const [nome, setNome] = useState(isNova ? "" : regra.nome)
  const [descricao, setDescricao] = useState(isNova ? "" : (regra.descricao ?? ""))
  const [gatilho, setGatilho] = useState(isNova ? "CHAMADO_CRIADO" : regra.gatilho)
  const [operador, setOperador] = useState(isNova ? "E" : regra.operador)
  const [ativo, setAtivo] = useState(isNova ? true : regra.ativo)
  const [condicoes, setCondicoes] = useState<Condicao[]>(
    isNova ? [] : regra.condicoes.map((c) => ({ campo: c.campo, operador: c.operador, valor: c.valor })),
  )
  const [acoes, setAcoes] = useState<Acao[]>(
    isNova ? [] : regra.acoes.map((a) => ({ tipo: a.tipo, valor: a.valor })),
  )
  const [erro, setErro] = useState<string | null>(null)

  function atualizarCondicao(idx: number, campo: keyof Condicao, valor: string) {
    setCondicoes((prev) => {
      const nova = [...prev]
      if (campo === "campo") {
        // Resetar operador e valor ao trocar campo
        const novoTipo = tipoCampo(valor)
        nova[idx] = {
          ...nova[idx],
          campo: valor,
          operador: novoTipo === "id" ? "igual" : "contem",
          valor: "",
        }
      } else {
        nova[idx] = { ...nova[idx], [campo]: valor }
      }
      return nova
    })
  }

  function atualizarAcao(idx: number, key: keyof Acao, valor: string) {
    setAcoes((prev) => {
      const nova = [...prev]
      if (key === "tipo") {
        nova[idx] = { tipo: valor, valor: "" }
      } else {
        nova[idx] = { ...nova[idx], [key]: valor }
      }
      return nova
    })
  }

  async function salvar() {
    if (!nome.trim()) { setErro("Nome é obrigatório"); return }
    if (acoes.some((a) => !a.valor)) { setErro("Todas as ações precisam de um valor"); return }
    setErro(null)
    setSalvando(true)
    try {
      await onSalvar({ nome, descricao, gatilho, operador, ativo, condicoes, acoes })
    } catch (e: any) {
      setErro(e.message ?? "Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  const sel = "text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

  function renderValorCondicao(c: Condicao, idx: number) {
    const tipo = tipoCampo(c.campo)
    if (tipo === "id" && c.campo === "categoriaId")
      return (
        <select value={c.valor} onChange={(e) => atualizarCondicao(idx, "valor", e.target.value)} className={`${sel} flex-1`}>
          <option value="">Selecione...</option>
          {categorias.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      )
    if (tipo === "id" && c.campo === "prioridadeId")
      return (
        <select value={c.valor} onChange={(e) => atualizarCondicao(idx, "valor", e.target.value)} className={`${sel} flex-1`}>
          <option value="">Selecione...</option>
          {prioridades.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      )
    return (
      <input value={c.valor} onChange={(e) => atualizarCondicao(idx, "valor", e.target.value)}
        placeholder="Digite o valor..." className={`${sel} flex-1`} />
    )
  }

  function renderValorAcao(a: Acao, idx: number) {
    if (a.tipo === "DEFINIR_CATEGORIA")
      return (
        <select value={a.valor} onChange={(e) => atualizarAcao(idx, "valor", e.target.value)} className={`${sel} w-full`}>
          <option value="">Selecione a categoria...</option>
          {categorias.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      )
    if (a.tipo === "DEFINIR_PRIORIDADE")
      return (
        <select value={a.valor} onChange={(e) => atualizarAcao(idx, "valor", e.target.value)} className={`${sel} w-full`}>
          <option value="">Selecione a prioridade...</option>
          {prioridades.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      )
    if (a.tipo === "DEFINIR_COLUNA")
      return (
        <select value={a.valor} onChange={(e) => atualizarAcao(idx, "valor", e.target.value)} className={`${sel} w-full`}>
          <option value="">Selecione a coluna...</option>
          {colunas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      )
    if (a.tipo === "ATRIBUIR_USUARIO")
      return (
        <select value={a.valor} onChange={(e) => atualizarAcao(idx, "valor", e.target.value)} className={`${sel} w-full`}>
          <option value="">Selecione o responsável...</option>
          {usuarios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      )
    if (a.tipo === "ENVIAR_EMAIL")
      return (
        <div className="space-y-1.5">
          <select value={a.valor} onChange={(e) => atualizarAcao(idx, "valor", e.target.value)} className={`${sel} w-full`}>
            <option value="">Selecione o template de e-mail...</option>
            {templates.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
          <p className="text-xs text-gray-400">
            Variáveis:{" "}
            {["{{assunto}}", "{{nome_cliente}}", "{{email_cliente}}", "{{prazo_sla}}"].map((v) => (
              <code key={v} className="bg-gray-100 px-1 py-0.5 rounded mr-1">{v}</code>
            ))}
          </p>
        </div>
      )
    if (a.tipo === "NOTIFICAR_INTERNO")
      return (
        <select value={a.valor} onChange={(e) => atualizarAcao(idx, "valor", e.target.value)} className={`${sel} w-full`}>
          <option value="">Quem notificar...</option>
          {NOTIFICAR_OPCOES_FIXAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          {usuarios.map((u) => <option key={u.id} value={`user:${u.id}`}>{u.nome} (específico)</option>)}
        </select>
      )
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {isNova ? "Nova regra automática" : "Editar regra"}
          </h2>
          <button onClick={onFechar}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-lg leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Nome + Quando */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <label className="text-xs text-gray-500 mb-1.5 block">Nome da regra</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Urgente por assunto"
                className={`${sel} w-full`} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1.5 block">Quando</label>
              <select value={gatilho} onChange={(e) => setGatilho(e.target.value)} className={`${sel} w-full`}>
                {GATILHOS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>

          {/* Bloco SE */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Se</span>
                {condicoes.length > 1 && (
                  <div className="flex gap-0.5 bg-white border border-gray-200 rounded-md p-0.5 shadow-sm">
                    {["E", "OU"].map((op) => (
                      <button key={op} type="button" onClick={() => setOperador(op)}
                        className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${
                          operador === op ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-600"
                        }`}>
                        {op}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button"
                onClick={() => setCondicoes([...condicoes, { campo: "assunto", operador: "contem", valor: "" }])}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Condição
              </button>
            </div>

            {condicoes.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center px-4 py-5">
                Sem filtros — dispara sempre que o gatilho ocorre
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {condicoes.map((c, idx) => {
                  const tipo = tipoCampo(c.campo)
                  const ops = tipo === "id" ? OPERADORES_ID : OPERADORES_TEXTO
                  return (
                    <div key={idx} className="px-4 py-3 space-y-2">
                      {idx > 0 && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{operador}</p>
                      )}
                      {/* Linha 1: campo */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-12 flex-shrink-0">Campo</span>
                        <select value={c.campo} onChange={(e) => atualizarCondicao(idx, "campo", e.target.value)}
                          className={`${sel} flex-1`}>
                          {CAMPOS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <button type="button"
                          onClick={() => setCondicoes(condicoes.filter((_, i) => i !== idx))}
                          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {/* Linha 2: operador + valor */}
                      <div className="flex items-start gap-2 pl-14">
                        <select value={c.operador} onChange={(e) => atualizarCondicao(idx, "operador", e.target.value)}
                          className={`${sel} flex-shrink-0`}>
                          {ops.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                        {renderValorCondicao(c, idx)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bloco ENTÃO */}
          <div className="rounded-xl border border-blue-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/60 border-b border-blue-100">
              <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Então</span>
              <button type="button"
                onClick={() => setAcoes([...acoes, { tipo: "DEFINIR_CATEGORIA", valor: "" }])}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ação
              </button>
            </div>

            {acoes.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center px-4 py-5">
                Adicione ao menos uma ação
              </p>
            ) : (
              <div className="divide-y divide-blue-50">
                {acoes.map((a, idx) => (
                  <div key={idx} className="px-4 py-3 space-y-2">
                    {/* Linha 1: tipo */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12 flex-shrink-0">Ação</span>
                      <select value={a.tipo} onChange={(e) => atualizarAcao(idx, "tipo", e.target.value)}
                        className={`${sel} flex-1`}>
                        {TIPOS_ACAO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <button type="button"
                        onClick={() => setAcoes(acoes.filter((_, i) => i !== idx))}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Linha 2: valor */}
                    <div className="pl-14">
                      {renderValorAcao(a, idx)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-3">
            <button type="button" role="switch" aria-checked={ativo} onClick={() => setAtivo(!ativo)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                ativo ? "bg-blue-600" : "bg-gray-200"
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                ativo ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
            <span className="text-sm text-gray-600">{ativo ? "Regra ativa" : "Regra inativa"}</span>
          </div>

          {erro && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={salvar} disabled={salvando || !nome.trim() || acoes.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            {salvando ? "Salvando..." : isNova ? "Criar regra" : "Salvar alterações"}
          </button>
          <button onClick={onFechar}
            className="px-4 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AbaAutoRegras({
  departamentoId,
  categorias,
  prioridades,
  colunas,
  usuarios,
}: {
  departamentoId: string
  categorias: Categoria[]
  prioridades: Prioridade[]
  colunas: Coluna[]
  usuarios: Usuario[]
}) {
  const [regras, setRegras] = useState<AutoRegra[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<AutoRegra | "nova" | null>(null)
  const [confirmandoDeletar, setConfirmandoDeletar] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [resRegras, resTpl] = await Promise.all([
          fetch(`/api/regras?deptId=${departamentoId}`),
          fetch("/api/templates"),
        ])
        if (resRegras.ok) setRegras(await resRegras.json())
        if (resTpl.ok) setTemplates(await resTpl.json())
      } catch (e) {
        console.error("[auto-regras] Erro ao carregar:", e)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [departamentoId])

  async function salvar(dados: Omit<AutoRegra, "id" | "ordem">) {
    const isNova = editando === "nova"
    const url = isNova ? "/api/regras" : `/api/regras/${(editando as AutoRegra).id}`
    const method = isNova ? "POST" : "PATCH"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dados, departamentoId }),
    })
    if (!res.ok) throw new Error("Erro ao salvar")
    const regra: AutoRegra = await res.json()

    setRegras((prev) =>
      isNova ? [...prev, regra] : prev.map((r) => (r.id === regra.id ? regra : r)),
    )
    setEditando(null)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const res = await fetch(`/api/regras/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo }),
    })
    if (res.ok) {
      const atualizada: AutoRegra = await res.json()
      setRegras((prev) => prev.map((r) => (r.id === atualizada.id ? atualizada : r)))
    }
  }

  async function deletar(id: string) {
    const res = await fetch(`/api/regras/${id}`, { method: "DELETE" })
    if (res.ok) {
      setRegras((prev) => prev.filter((r) => r.id !== id))
      setConfirmandoDeletar(null)
    }
  }

  if (carregando) {
    return <div className="text-center py-12 text-sm text-gray-400">Carregando regras...</div>
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Regras automáticas</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Defina ações automáticas baseadas em condições dos chamados
          </p>
        </div>
        <button
          onClick={() => setEditando("nova")}
          className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova regra
        </button>
      </div>

      {/* Lista */}
      {regras.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <svg className="w-10 h-10 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">Nenhuma regra criada</p>
          <p className="text-xs text-gray-400 mt-1">Crie regras para automatizar categorização e e-mails</p>
        </div>
      ) : (
        <div className="space-y-2">
          {regras.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border p-4 transition-colors ${
                r.ativo ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Toggle ativo */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.ativo}
                  onClick={() => toggleAtivo(r.id, !r.ativo)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors mt-0.5 ${
                    r.ativo ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${r.ativo ? "translate-x-4" : "translate-x-0"}`} />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{r.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corGatilho(r.gatilho)}`}>
                      {labelGatilho(r.gatilho)}
                    </span>
                  </div>
                  {r.descricao && (
                    <p className="text-xs text-gray-400 mt-0.5">{r.descricao}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {r.condicoes.length === 0
                        ? "Sem condições"
                        : `${r.condicoes.length} condição${r.condicoes.length !== 1 ? "ões" : ""} (${r.operador})`}
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">
                      {r.acoes.length} ação{r.acoes.length !== 1 ? "ões" : ""}
                    </span>
                  </div>

                  {/* Preview compacto das condições e ações */}
                  {(r.condicoes.length > 0 || r.acoes.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.condicoes.slice(0, 2).map((c, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {CAMPOS.find((f) => f.value === c.campo)?.label ?? c.campo}{" "}
                          {OPERADORES_TEXTO.find((o) => o.value === c.operador)?.label ?? c.operador}{" "}
                          "{c.valor.length > 20 ? c.valor.slice(0, 20) + "…" : c.valor}"
                        </span>
                      ))}
                      {r.condicoes.length > 2 && (
                        <span className="text-xs text-gray-400">+{r.condicoes.length - 2}</span>
                      )}
                      {r.acoes.slice(0, 2).map((a, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {TIPOS_ACAO.find((t) => t.value === a.tipo)?.label ?? a.tipo}
                        </span>
                      ))}
                      {r.acoes.length > 2 && (
                        <span className="text-xs text-gray-400">+{r.acoes.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditando(r)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {confirmandoDeletar === r.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deletar(r.id)}
                        className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmandoDeletar(null)}
                        className="text-xs text-gray-500 px-1 py-1"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmandoDeletar(r.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando !== null && (
        <ModalRegra
          regra={editando}
          departamentoId={departamentoId}
          categorias={categorias}
          prioridades={prioridades}
          colunas={colunas}
          usuarios={usuarios}
          templates={templates}
          onSalvar={salvar}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  )
}
