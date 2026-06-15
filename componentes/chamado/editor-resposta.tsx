"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Image from "@tiptap/extension-image"
import { useState, useRef, useEffect } from "react"
import { CampoDestinatarios } from "./campo-destinatarios"

export type AcaoEnvio = "enviar" | "resolver"
type Template = { id: string; nome: string; assunto: string; conteudoHtml: string }

export function EditorResposta({
  paraInicial,
  ccInicial = [],
  assinatura,
  templates = [],
  onEnviar,
  onCancelar,
  enviando,
}: {
  paraInicial: string[]
  ccInicial?: string[]
  assinatura?: string | null
  templates?: Template[]
  onEnviar: (html: string, acao: AcaoEnvio, para: string[], cc: string[], arquivos: File[]) => Promise<void>
  onCancelar: () => void
  enviando: boolean
}) {
  const [para, setPara] = useState(paraInicial)
  const [cc, setCc] = useState(ccInicial)
  const [mostrarCc, setMostrarCc] = useState(ccInicial.length > 0)
  const [arquivos, setArquivos] = useState<File[]>([])
  const [temConteudo, setTemConteudo] = useState(!!assinatura)
  const [mostrarTemplates, setMostrarTemplates] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  const conteudoInicial = assinatura ? `<p></p><p>--&nbsp;</p>${assinatura}` : ""

  const editor = useEditor({
    extensions: [StarterKit, Underline, Image.configure({ allowBase64: true })],
    content: conteudoInicial,
    immediatelyRender: false,
    autofocus: "start",
    onCreate: ({ editor }) => setTemConteudo(!editor.isEmpty),
    onUpdate: ({ editor }) => setTemConteudo(!editor.isEmpty),
    editorProps: {
      attributes: {
        class: "min-h-[160px] p-4 focus:outline-none text-sm text-gray-800 leading-relaxed",
      },
    },
  })

  function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    setArquivos((prev) => [...prev, ...Array.from(e.target.files ?? [])])
    e.target.value = ""
  }

  function handleEnviar(acao: AcaoEnvio) {
    if (!editor || editor.isEmpty) return
    onEnviar(editor.getHTML(), acao, para, cc, arquivos)
  }

  if (!editor) return null

  return (
    <div>
      {/* Destinatários */}
      <div className="px-4 py-2 border-b border-gray-100 space-y-1">
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
        {mostrarCc && (
          <CampoDestinatarios label="CC" emails={cc} onChange={setCc} />
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100">
        <BotaoToolbar onClick={() => editor.chain().focus().toggleBold().run()} ativo={editor.isActive("bold")} titulo="Negrito">
          <strong>B</strong>
        </BotaoToolbar>
        <BotaoToolbar onClick={() => editor.chain().focus().toggleItalic().run()} ativo={editor.isActive("italic")} titulo="Itálico">
          <em>I</em>
        </BotaoToolbar>
        <BotaoToolbar onClick={() => editor.chain().focus().toggleUnderline().run()} ativo={editor.isActive("underline")} titulo="Sublinhado">
          <span className="underline">U</span>
        </BotaoToolbar>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <BotaoToolbar onClick={() => editor.chain().focus().toggleBulletList().run()} ativo={editor.isActive("bulletList")} titulo="Lista">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </BotaoToolbar>
        <BotaoToolbar onClick={() => editor.chain().focus().toggleOrderedList().run()} ativo={editor.isActive("orderedList")} titulo="Lista numerada">
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

        {templates.length > 0 && (
          <div className="relative ml-1">
            <button
              type="button"
              title="Templates"
              onClick={() => setMostrarTemplates(!mostrarTemplates)}
              onBlur={() => setTimeout(() => setMostrarTemplates(false), 150)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:bg-gray-100 px-2 h-8 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Templates
            </button>
            {mostrarTemplates && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      editor.commands.setContent(t.conteudoHtml)
                      setTemConteudo(true)
                      setMostrarTemplates(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800">{t.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{t.assunto}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Arquivos */}
      {arquivos.length > 0 && (
        <div className="px-4 pt-2 pb-3 flex flex-wrap gap-2 border-t border-gray-50">
          {arquivos.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="max-w-[160px] truncate">{f.name}</span>
              <span className="text-gray-400 flex-shrink-0">({(f.size / 1024).toFixed(0)} kb)</span>
              <button type="button" onClick={() => setArquivos((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-0.5 font-bold">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100">
        <button type="button" onClick={onCancelar} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Cancelar
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleEnviar("enviar")}
            disabled={enviando || !temConteudo || para.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {enviando ? "Enviando..." : "Enviar"}
          </button>
          <button
            type="button"
            onClick={() => handleEnviar("resolver")}
            disabled={enviando || !temConteudo || para.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Enviar e Resolver
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
