"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Image from "@tiptap/extension-image"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { CampoDestinatarios } from "./campo-destinatarios"

type Categoria = { id: string; nome: string }
type Prioridade = { id: string; nome: string; cor: string }

export function NovoChamadoModal({
  onFechar,
  categorias,
  prioridades,
  assinatura,
  departamentoId,
}: {
  onFechar: () => void
  categorias: Categoria[]
  prioridades: Prioridade[]
  assinatura?: string | null
  departamentoId?: string
}) {
  const router = useRouter()
  const [assunto, setAssunto] = useState("")
  const [para, setPara] = useState<string[]>([])
  const [cc, setCc] = useState<string[]>([])
  const [mostrarCc, setMostrarCc] = useState(false)
  const [categoriaId, setCategoriaId] = useState("")
  const [prioridadeId, setPrioridadeId] = useState("")
  const [arquivos, setArquivos] = useState<File[]>([])
  const [temConteudo, setTemConteudo] = useState(!!assinatura)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  const conteudoInicial = assinatura ? `<p></p><p>--&nbsp;</p>${assinatura}` : "<p></p>"

  const editor = useEditor({
    extensions: [StarterKit, Underline, Image.configure({ allowBase64: true })],
    content: conteudoInicial,
    immediatelyRender: false,
    autofocus: "start",
    onCreate: ({ editor }) => setTemConteudo(!editor.isEmpty),
    onUpdate: ({ editor }) => setTemConteudo(!editor.isEmpty),
    editorProps: {
      attributes: {
        class: "min-h-[200px] p-4 focus:outline-none text-sm text-gray-800 leading-relaxed",
      },
    },
  })

  function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    setArquivos((prev) => [...prev, ...Array.from(e.target.files ?? [])])
    e.target.value = ""
  }

  async function handleEnviar() {
    if (!editor || !temConteudo || para.length === 0 || !assunto.trim()) return
    setEnviando(true)
    setErro(null)
    try {
      const fd = new FormData()
      fd.append("assunto", assunto.trim())
      fd.append("conteudoHtml", editor.getHTML())
      para.forEach((e) => fd.append("para", e))
      cc.forEach((e) => fd.append("cc", e))
      if (categoriaId) fd.append("categoriaId", categoriaId)
      if (prioridadeId) fd.append("prioridadeId", prioridadeId)
      if (departamentoId) fd.append("departamentoId", departamentoId)
      arquivos.forEach((f) => fd.append("arquivos", f))

      const res = await fetch("/api/chamados/novo", { method: "POST", body: fd })
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}))
        throw new Error(dados.erro ?? `Erro ${res.status}`)
      }
      router.refresh()
      onFechar()
    } catch (e: any) {
      setErro(e.message ?? "Erro ao criar chamado")
    } finally {
      setEnviando(false)
    }
  }

  const podeEnviar = temConteudo && para.length > 0 && assunto.trim().length > 0 && !enviando

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Novo chamado</h2>
          <button
            type="button"
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Destinatários e assunto */}
          <div className="px-6 py-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-2">
              <CampoDestinatarios label="Para" emails={para} onChange={setPara} />
              {!mostrarCc && (
                <button
                  type="button"
                  onClick={() => setMostrarCc(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 px-1"
                >
                  + CC
                </button>
              )}
            </div>
            {mostrarCc && <CampoDestinatarios label="CC" emails={cc} onChange={setCc} />}
            <input
              type="text"
              placeholder="Assunto"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full text-sm text-gray-900 placeholder-gray-400 border-0 outline-none py-1"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100">
            <BotaoToolbar onClick={() => editor?.chain().focus().toggleBold().run()} ativo={editor?.isActive("bold") ?? false} titulo="Negrito">
              <strong>B</strong>
            </BotaoToolbar>
            <BotaoToolbar onClick={() => editor?.chain().focus().toggleItalic().run()} ativo={editor?.isActive("italic") ?? false} titulo="Itálico">
              <em>I</em>
            </BotaoToolbar>
            <BotaoToolbar onClick={() => editor?.chain().focus().toggleUnderline().run()} ativo={editor?.isActive("underline") ?? false} titulo="Sublinhado">
              <span className="underline">U</span>
            </BotaoToolbar>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <BotaoToolbar onClick={() => editor?.chain().focus().toggleBulletList().run()} ativo={editor?.isActive("bulletList") ?? false} titulo="Lista">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </BotaoToolbar>
            <BotaoToolbar onClick={() => editor?.chain().focus().toggleOrderedList().run()} ativo={editor?.isActive("orderedList") ?? false} titulo="Lista numerada">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </BotaoToolbar>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              type="button"
              title="Anexar arquivo"
              onClick={() => inputArquivoRef.current?.click()}
              className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input ref={inputArquivoRef} type="file" multiple className="hidden" onChange={handleArquivos} />
          </div>

          {/* Editor */}
          {editor && <EditorContent editor={editor} />}

          {/* Arquivos */}
          {arquivos.length > 0 && (
            <div className="px-4 pt-2 pb-3 flex flex-wrap gap-2 border-t border-gray-50">
              {arquivos.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600">
                  <span className="max-w-[160px] truncate">{f.name}</span>
                  <span className="text-gray-400">({(f.size / 1024).toFixed(0)} kb)</span>
                  <button type="button" onClick={() => setArquivos((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 font-bold ml-1">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Categoria e prioridade */}
          {(categorias.length > 0 || prioridades.length > 0) && (
            <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-6">
              {categorias.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 flex-shrink-0">Categoria</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">—</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {prioridades.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 flex-shrink-0">Prioridade</label>
                  <select
                    value={prioridadeId}
                    onChange={(e) => setPrioridadeId(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">—</option>
                    {prioridades.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {erro && (
            <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erro}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onFechar} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEnviar}
            disabled={!podeEnviar}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {enviando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function BotaoToolbar({ children, onClick, ativo, titulo }: {
  children: React.ReactNode
  onClick: () => void
  ativo: boolean
  titulo: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${ativo ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  )
}
