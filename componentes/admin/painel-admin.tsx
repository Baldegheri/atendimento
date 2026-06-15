"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { EditorAssinatura, type EditorAssinaturaRef } from "./editor-assinatura"
import { AbaAutoRegras } from "./aba-auto-regras"

type Categoria = { id: string; nome: string; descricao: string | null }
type Prioridade = { id: string; nome: string; horasSla: number; cor: string; ordem: number }
type Coluna = { id: string; nome: string; ordem: number; cor: string; padrao: boolean; resolvido: boolean }
type Usuario = { id: string; nome: string; email: string; cargo: "ADM" | "HC"; status: "PENDENTE" | "ATIVO" | "INATIVO"; criadoEm: string }
type Template = { id: string; nome: string; assunto: string; conteudoHtml: string; criadoEm: string }
type Assinatura = { id: string; nome: string; conteudoHtml: string; padrao: boolean }
type Regra = { id: string; palavraChave: string; categoriaId: string; categoria: { id: string; nome: string } }
type Horario = { id: string; diaSemana: number; horaInicio: string; horaFim: string; ativo: boolean }

type Aba = "usuarios" | "membros" | "categorias" | "prioridades" | "colunas" | "templates" | "assinaturas" | "clientes" | "regras" | "horarios"

export function PainelAdmin({
  usuarioAtualId,
  departamentoId,
  departamentoNome,
  categoriasIniciais,
  prioridadesIniciais,
  colunasIniciais,
  usuariosIniciais,
  templatesIniciais,
}: {
  usuarioAtualId: string
  departamentoId: string
  departamentoNome: string
  categoriasIniciais: Categoria[]
  prioridadesIniciais: Prioridade[]
  colunasIniciais: Coluna[]
  usuariosIniciais: Usuario[]
  templatesIniciais: Template[]
}) {
  const [aba, setAba] = useState<Aba>("usuarios")
  const [categorias, setCategorias] = useState(categoriasIniciais)
  const [prioridades, setPrioridades] = useState(prioridadesIniciais)
  const [colunas, setColunas] = useState(colunasIniciais)
  const [usuarios, setUsuarios] = useState(usuariosIniciais)
  const [templates, setTemplates] = useState(templatesIniciais)
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [assinaturasCarregadas, setAssinaturasCarregadas] = useState(false)
  const [regras, setRegras] = useState<Regra[]>([])
  const [regrasCarregadas, setRegrasCarregadas] = useState(false)
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [horariosCarregados, setHorariosCarregados] = useState(false)

  async function carregarAssinaturas() {
    if (assinaturasCarregadas) return
    const res = await fetch("/api/assinaturas")
    if (res.ok) setAssinaturas(await res.json())
    setAssinaturasCarregadas(true)
  }

  async function carregarRegras() {
    if (regrasCarregadas) return
    const res = await fetch(`/api/admin/regras?deptId=${departamentoId}`)
    if (res.ok) setRegras(await res.json())
    setRegrasCarregadas(true)
  }

  async function carregarHorarios() {
    if (horariosCarregados) return
    const res = await fetch(`/api/admin/horarios?deptId=${departamentoId}`)
    if (res.ok) setHorarios(await res.json())
    setHorariosCarregados(true)
  }

  function mudarAba(a: Aba) {
    setAba(a)
    if (a === "assinaturas") carregarAssinaturas()
    if (a === "regras") carregarRegras()
    if (a === "horarios") carregarHorarios()
  }

  const abas: { id: Aba; label: string }[] = [
    { id: "usuarios", label: "Usuários" },
    { id: "membros", label: "Membros" },
    { id: "categorias", label: "Categorias" },
    { id: "prioridades", label: "Prioridades" },
    { id: "colunas", label: "Colunas" },
    { id: "templates", label: "Templates" },
    { id: "assinaturas", label: "Assinaturas" },
    { id: "clientes", label: "Clientes" },
    { id: "regras", label: "Regras" },
    { id: "horarios", label: "Horários SLA" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href={`/painel/${departamentoId}`} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Painel Admin</h1>
          <p className="text-xs text-gray-400">{departamentoNome}</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => mudarAba(a.id)}
              className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
                aba === a.id ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {aba === "usuarios" && (
          <AbaUsuarios usuarios={usuarios} setUsuarios={setUsuarios} usuarioAtualId={usuarioAtualId} />
        )}
        {aba === "membros" && (
          <AbaMembros departamentoId={departamentoId} />
        )}
        {aba === "categorias" && (
          <AbaCategorias categorias={categorias} setCategorias={setCategorias} departamentoId={departamentoId} />
        )}
        {aba === "prioridades" && (
          <AbaPrioridades prioridades={prioridades} setPrioridades={setPrioridades} departamentoId={departamentoId} />
        )}
        {aba === "colunas" && (
          <AbaColunas colunas={colunas} setColunas={setColunas} departamentoId={departamentoId} />
        )}
        {aba === "templates" && (
          <AbaTemplates templates={templates} setTemplates={setTemplates} />
        )}
        {aba === "assinaturas" && (
          <AbaAssinaturas assinaturas={assinaturas} setAssinaturas={setAssinaturas} />
        )}
        {aba === "clientes" && (
          <AbaClientes />
        )}
        {aba === "regras" && (
          <AbaAutoRegras
            departamentoId={departamentoId}
            categorias={categorias}
            prioridades={prioridades}
            colunas={colunas}
            usuarios={usuarios}
          />
        )}
        {aba === "horarios" && (
          <AbaHorarios horarios={horarios} setHorarios={setHorarios} />
        )}
      </div>
    </div>
  )
}

// ─── Horários SLA ─────────────────────────────────────────────────────────────

const NOMES_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

function AbaHorarios({
  horarios,
  setHorarios,
}: {
  horarios: Horario[]
  setHorarios: (h: Horario[]) => void
}) {
  const [locais, setLocais] = useState<Horario[]>(horarios)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => { if (horarios.length > 0) setLocais(horarios) }, [horarios])

  function atualizar(idx: number, campo: Partial<Horario>) {
    setLocais((prev) => prev.map((h, i) => (i === idx ? { ...h, ...campo } : h)))
  }

  async function salvar() {
    setSalvando(true)
    setMensagem(null)
    const res = await fetch("/api/admin/horarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locais),
    })
    if (res.ok) {
      setHorarios(locais)
      setMensagem("Horários salvos com sucesso.")
    } else {
      setMensagem("Erro ao salvar.")
    }
    setSalvando(false)
  }

  if (locais.length === 0) {
    return <p className="text-sm text-gray-400">Carregando...</p>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Horário de Atendimento</h2>
        <p className="text-xs text-gray-500">Define o horário útil para cálculo e pausa do SLA.</p>
      </div>

      <div className="divide-y divide-gray-100">
        {locais.map((h, idx) => (
          <div key={h.id} className="flex items-center gap-4 py-3">
            <label className="flex items-center gap-2 w-8">
              <input
                type="checkbox"
                checked={h.ativo}
                onChange={(e) => atualizar(idx, { ativo: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600"
              />
            </label>
            <span className={`text-sm w-20 ${h.ativo ? "text-gray-800 font-medium" : "text-gray-400"}`}>
              {NOMES_DIA[h.diaSemana]}
            </span>
            {h.ativo ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={h.horaInicio}
                  onChange={(e) => atualizar(idx, { horaInicio: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">às</span>
                <input
                  type="time"
                  value={h.horaFim}
                  onChange={(e) => atualizar(idx, { horaFim: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ) : (
              <span className="text-xs text-gray-400">Não atende</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {salvando ? "Salvando..." : "Salvar horários"}
        </button>
        {mensagem && <span className="text-sm text-gray-500">{mensagem}</span>}
      </div>
    </div>
  )
}

// ─── Usuários ────────────────────────────────────────────────────────────────

function AbaUsuarios({ usuarios, setUsuarios, usuarioAtualId }: {
  usuarios: Usuario[]
  setUsuarios: (u: Usuario[]) => void
  usuarioAtualId: string
}) {
  async function atualizar(id: string, campo: Partial<Pick<Usuario, "cargo" | "status">>) {
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campo),
    })
    if (!res.ok) return
    const atualizado = await res.json()
    setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, ...atualizado } : u)))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {usuarios.map((u) => {
            const eAtual = u.id === usuarioAtualId
            return (
              <tr key={u.id} className={eAtual ? "bg-blue-50" : ""}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.nome} {eAtual && <span className="text-xs text-blue-500">(você)</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.cargo}
                    disabled={eAtual}
                    onChange={(e) => atualizar(u.id, { cargo: e.target.value as "ADM" | "HC" })}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="HC">HC</option>
                    <option value="ADM">ADM</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.status}
                    disabled={eAtual}
                    onChange={(e) => atualizar(u.id, { status: e.target.value as Usuario["status"] })}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Categorias ───────────────────────────────────────────────────────────────

function AbaCategorias({ categorias, setCategorias, departamentoId }: { categorias: Categoria[]; setCategorias: (c: Categoria[]) => void; departamentoId?: string }) {
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function criar() {
    if (!nome.trim()) return
    setSalvando(true)
    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), descricao: descricao.trim() || null, departamentoId: departamentoId ?? null }),
    })
    if (res.ok) {
      setCategorias([...categorias, await res.json()])
      setNome("")
      setDescricao("")
    }
    setSalvando(false)
  }

  async function remover(id: string) {
    const res = await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" })
    if (res.ok) setCategorias(categorias.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da categoria"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Descrição (opcional)</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={criar} disabled={salvando || !nome.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Criar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {categorias.length === 0 && <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhuma categoria</p>}
        {categorias.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{c.nome}</p>
              {c.descricao && <p className="text-xs text-gray-400">{c.descricao}</p>}
            </div>
            <button onClick={() => remover(c.id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Prioridades ──────────────────────────────────────────────────────────────

function AbaPrioridades({ prioridades, setPrioridades, departamentoId }: { prioridades: Prioridade[]; setPrioridades: (p: Prioridade[]) => void; departamentoId?: string }) {
  const [nome, setNome] = useState("")
  const [horasSla, setHorasSla] = useState("8")
  const [cor, setCor] = useState("#f59e0b")
  const [ordem, setOrdem] = useState("0")
  const [salvando, setSalvando] = useState(false)

  async function criar() {
    if (!nome.trim()) return
    setSalvando(true)
    const res = await fetch("/api/admin/prioridades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), horasSla: Number(horasSla), cor, ordem: Number(ordem), departamentoId: departamentoId ?? null }),
    })
    if (res.ok) {
      setPrioridades([...prioridades, await res.json()])
      setNome("")
    }
    setSalvando(false)
  }

  async function remover(id: string) {
    const res = await fetch(`/api/admin/prioridades/${id}`, { method: "DELETE" })
    if (res.ok) setPrioridades(prioridades.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Urgente"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Horas SLA</label>
          <input type="number" value={horasSla} onChange={(e) => setHorasSla(e.target.value)} min="1"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-24" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Cor</label>
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
            className="h-9 w-12 border border-gray-200 rounded-lg cursor-pointer" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Ordem</label>
          <input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} min="0"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-20" />
        </div>
        <button onClick={criar} disabled={salvando || !nome.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Criar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {prioridades.length === 0 && <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhuma prioridade</p>}
        {prioridades.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.cor }} />
              <div>
                <p className="text-sm font-medium text-gray-900">{p.nome}</p>
                <p className="text-xs text-gray-400">{p.horasSla}h SLA · ordem {p.ordem}</p>
              </div>
            </div>
            <button onClick={() => remover(p.id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Colunas ─────────────────────────────────────────────────────────────────

function AbaColunas({ colunas, setColunas, departamentoId }: { colunas: Coluna[]; setColunas: (c: Coluna[]) => void; departamentoId?: string }) {
  const [nome, setNome] = useState("")
  const [cor, setCor] = useState("#6366f1")
  const [ordem, setOrdem] = useState("0")
  const [padrao, setPadrao] = useState(false)
  const [resolvido, setResolvido] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function criar() {
    if (!nome.trim()) return
    setSalvando(true)
    const res = await fetch("/api/admin/colunas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), cor, ordem: Number(ordem), padrao, resolvido, departamentoId: departamentoId ?? null }),
    })
    if (res.ok) {
      setColunas([...colunas, await res.json()])
      setNome("")
    }
    setSalvando(false)
  }

  async function remover(id: string) {
    const res = await fetch(`/api/admin/colunas/${id}`, { method: "DELETE" })
    if (res.ok) setColunas(colunas.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da coluna"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Cor</label>
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
            className="h-9 w-12 border border-gray-200 rounded-lg cursor-pointer" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Ordem</label>
          <input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} min="0"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-20" />
        </div>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} className="rounded" />
          Padrão
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={resolvido} onChange={(e) => setResolvido(e.target.checked)} className="rounded" />
          Resolvido
        </label>
        <button onClick={criar} disabled={salvando || !nome.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Criar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {colunas.length === 0 && <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhuma coluna</p>}
        {colunas.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} />
              <div>
                <p className="text-sm font-medium text-gray-900">{c.nome}</p>
                <p className="text-xs text-gray-400">
                  ordem {c.ordem}
                  {c.padrao && " · padrão"}
                  {c.resolvido && " · resolvido"}
                </p>
              </div>
            </div>
            <button onClick={() => remover(c.id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Templates ────────────────────────────────────────────────────────────────

function AbaTemplates({ templates, setTemplates }: { templates: Template[]; setTemplates: (t: Template[]) => void }) {
  const [editando, setEditando] = useState<Template | null>(null)
  const [nome, setNome] = useState("")
  const [assunto, setAssunto] = useState("")
  const [conteudoHtml, setConteudoHtml] = useState("")
  const [salvando, setSalvando] = useState(false)

  function iniciarEdicao(t: Template) {
    setEditando(t)
    setNome(t.nome)
    setAssunto(t.assunto)
    setConteudoHtml(t.conteudoHtml)
  }

  function cancelar() {
    setEditando(null)
    setNome("")
    setAssunto("")
    setConteudoHtml("")
  }

  async function salvar() {
    if (!nome.trim() || !assunto.trim() || !conteudoHtml.trim()) return
    setSalvando(true)

    if (editando) {
      const res = await fetch(`/api/templates/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, assunto, conteudoHtml }),
      })
      if (res.ok) {
        const atualizado = await res.json()
        setTemplates(templates.map((t) => (t.id === editando.id ? atualizado : t)))
        cancelar()
      }
    } else {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, assunto, conteudoHtml }),
      })
      if (res.ok) {
        setTemplates([...templates, await res.json()])
        cancelar()
      }
    }

    setSalvando(false)
  }

  async function remover(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
    if (res.ok) setTemplates(templates.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-900">{editando ? "Editar template" : "Novo template"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do template"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Assunto</label>
            <input value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Assunto padrão"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Conteúdo (HTML)</label>
          <textarea value={conteudoHtml} onChange={(e) => setConteudoHtml(e.target.value)} rows={6} placeholder="<p>Olá,</p><p>...</p>"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" />
        </div>
        <div className="flex gap-2">
          <button onClick={salvar} disabled={salvando || !nome.trim() || !assunto.trim() || !conteudoHtml.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {salvando ? "Salvando..." : editando ? "Salvar" : "Criar"}
          </button>
          {editando && (
            <button onClick={cancelar} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {templates.length === 0 && <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhum template</p>}
        {templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{t.nome}</p>
              <p className="text-xs text-gray-400">{t.assunto}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => iniciarEdicao(t)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors">
                Editar
              </button>
              <button onClick={() => remover(t.id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Assinaturas ─────────────────────────────────────────────────────────────

function AbaAssinaturas({ assinaturas, setAssinaturas }: { assinaturas: Assinatura[]; setAssinaturas: (a: Assinatura[]) => void }) {
  const [editando, setEditando] = useState<Assinatura | null>(null)
  const [nome, setNome] = useState("")
  const [padrao, setPadrao] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const editorRef = useRef<EditorAssinaturaRef>(null)

  function iniciarEdicao(a: Assinatura) {
    setEditando(a)
    setNome(a.nome)
    setPadrao(a.padrao)
    setTimeout(() => editorRef.current?.setContent(a.conteudoHtml), 50)
  }

  function cancelar() {
    setEditando(null)
    setNome("")
    setPadrao(false)
    editorRef.current?.setContent("")
  }

  async function salvar() {
    const conteudoHtml = editorRef.current?.getHTML() ?? ""
    if (!nome.trim() || !conteudoHtml || editorRef.current?.isEmpty()) return
    setSalvando(true)

    if (editando) {
      const res = await fetch(`/api/assinaturas/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, conteudoHtml, padrao }),
      })
      if (res.ok) {
        const atualizada = await res.json()
        setAssinaturas(
          assinaturas.map((a) =>
            padrao ? { ...a, padrao: a.id === editando.id } : a.id === editando.id ? atualizada : a
          )
        )
        cancelar()
      }
    } else {
      const res = await fetch("/api/assinaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, conteudoHtml, padrao }),
      })
      if (res.ok) {
        const nova = await res.json()
        setAssinaturas(padrao ? [...assinaturas.map((a) => ({ ...a, padrao: false })), nova] : [...assinaturas, nova])
        cancelar()
      }
    }

    setSalvando(false)
  }

  async function remover(id: string) {
    const res = await fetch(`/api/assinaturas/${id}`, { method: "DELETE" })
    if (res.ok) setAssinaturas(assinaturas.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-900">{editando ? "Editar assinatura" : "Nova assinatura"}</h3>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Assinatura padrão"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Conteúdo</label>
          <EditorAssinatura ref={editorRef} conteudoInicial="" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} className="rounded" />
          Usar como padrão
        </label>
        <div className="flex gap-2">
          <button onClick={salvar} disabled={salvando || !nome.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {salvando ? "Salvando..." : editando ? "Salvar" : "Criar"}
          </button>
          {editando && (
            <button onClick={cancelar} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {assinaturas.length === 0 && <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhuma assinatura</p>}
        {assinaturas.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{a.nome}</p>
                {a.padrao && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">padrão</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => iniciarEdicao(a)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors">
                Editar
              </button>
              <button onClick={() => remover(a.id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Clientes ────────────────────────────────────────────────────────────────

function AbaClientes() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<{ importados: number; ignorados: number } | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setImportando(true)
    setResultado(null)
    setErro(null)

    const formData = new FormData()
    formData.append("arquivo", arquivo)

    try {
      const res = await fetch("/api/admin/clientes/importar", { method: "POST", body: formData })
      if (res.ok) {
        setResultado(await res.json())
      } else {
        const json = await res.json().catch(() => ({}))
        setErro(json.erro ?? "Erro ao importar")
      }
    } catch {
      setErro("Erro de conexão")
    } finally {
      setImportando(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Importar contatos via CSV</h3>
          <p className="text-xs text-gray-500">
            O arquivo CSV deve conter as colunas:{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">email</span> (obrigatório),{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">nome</span>,{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">empresa</span>,{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">telefone</span> (opcionais).
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={aoSelecionarArquivo}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={importando}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {importando ? "Importando..." : "Selecionar arquivo CSV"}
        </button>

        {resultado && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            {resultado.importados} contato{resultado.importados !== 1 ? "s" : ""} importado{resultado.importados !== 1 ? "s" : ""}
            {resultado.ignorados > 0 && `, ${resultado.ignorados} ignorado${resultado.ignorados !== 1 ? "s" : ""}`}.
          </p>
        )}
        {erro && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{erro}</p>
        )}
      </div>
    </div>
  )
}

// ─── Regras ───────────────────────────────────────────────────────────────────

function AbaRegras({
  regras,
  setRegras,
  categorias,
}: {
  regras: Regra[]
  setRegras: (r: Regra[]) => void
  categorias: Categoria[]
}) {
  const [palavraChave, setPalavraChave] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function criar() {
    if (!palavraChave.trim() || !categoriaId) return
    setSalvando(true)
    const res = await fetch("/api/admin/regras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palavraChave: palavraChave.trim(), categoriaId }),
    })
    if (res.ok) {
      setRegras([...regras, await res.json()])
      setPalavraChave("")
      setCategoriaId("")
    }
    setSalvando(false)
  }

  async function remover(id: string) {
    const res = await fetch(`/api/admin/regras/${id}`, { method: "DELETE" })
    if (res.ok) setRegras(regras.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-40">
          <label className="text-xs text-gray-500 mb-1 block">Palavra-chave</label>
          <input
            value={palavraChave}
            onChange={(e) => setPalavraChave(e.target.value)}
            placeholder="Ex: urgente"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 min-w-40">
          <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <button
          onClick={criar}
          disabled={salvando || !palavraChave.trim() || !categoriaId}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Criar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {regras.length === 0 && <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhuma regra cadastrada</p>}
        {regras.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">{r.palavraChave}</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-700 font-medium">{r.categoria.nome}</span>
            </div>
            <button onClick={() => remover(r.id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Membros do Departamento ──────────────────────────────────────────────────

type MembroDept = {
  id: string
  usuarioId: string
  usuario: { id: string; nome: string; email: string; cargo: string; status: string }
}

function AbaMembros({ departamentoId }: { departamentoId: string }) {
  const [membros, setMembros] = useState<MembroDept[]>([])
  const [todos, setTodos] = useState<{ id: string; nome: string; email: string }[]>([])
  const [carregando, setCarregando] = useState(true)
  const [adicionandoId, setAdicionandoId] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/departamentos/${departamentoId}/membros`).then((r) => r.json()),
      fetch("/api/usuarios").then((r) => r.json()),
    ]).then(([mbs, usrs]) => {
      setMembros(mbs)
      setTodos(usrs)
      setCarregando(false)
    })
  }, [departamentoId])

  const naoMembros = todos.filter((u) => !membros.some((m) => m.usuarioId === u.id))

  async function adicionar() {
    if (!adicionandoId) return
    setSalvando(true)
    const res = await fetch(`/api/departamentos/${departamentoId}/membros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: adicionandoId }),
    })
    if (res.ok) {
      setMembros([...membros, await res.json()])
      setAdicionandoId("")
    }
    setSalvando(false)
  }

  async function removerMembro(usuarioId: string) {
    const res = await fetch(`/api/departamentos/${departamentoId}/membros/${usuarioId}`, { method: "DELETE" })
    if (res.ok) setMembros(membros.filter((m) => m.usuarioId !== usuarioId))
  }

  if (carregando) return <p className="text-sm text-gray-400">Carregando...</p>

  return (
    <div className="space-y-4">
      {naoMembros.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Adicionar membro</label>
            <select
              value={adicionandoId}
              onChange={(e) => setAdicionandoId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Selecione um usuário...</option>
              {naoMembros.map((u) => (
                <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>
              ))}
            </select>
          </div>
          <button
            onClick={adicionar}
            disabled={salvando || !adicionandoId}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Adicionar
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {membros.length === 0 && <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhum membro</p>}
        {membros.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{m.usuario.nome}</p>
              <p className="text-xs text-gray-400">{m.usuario.email} · {m.usuario.cargo}</p>
            </div>
            <button onClick={() => removerMembro(m.usuarioId)} className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
