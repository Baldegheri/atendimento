"use client"

import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { Image as TiptapImage } from "@tiptap/extension-image"
import { mergeAttributes, Node } from "@tiptap/core"
import { useRef, useImperativeHandle, forwardRef, useState } from "react"

// Imagem com suporte a largura redimensionável
const ImagemRedimensionavel = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, renderHTML: (a) => a.width ? { width: a.width, style: `width:${a.width}px;max-width:100%` } : {} },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ComponenteImagem)
  },
})

function ComponenteImagem({ node, updateAttributes, selected }: NodeViewProps) {
  const [largura, setLargura] = useState<string>(node.attrs.width?.toString() ?? "")

  function aplicar() {
    const v = parseInt(largura)
    if (!isNaN(v) && v > 0) updateAttributes({ width: v })
    else updateAttributes({ width: null })
  }

  return (
    <NodeViewWrapper className="inline-block relative">
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        style={{ width: node.attrs.width ? `${node.attrs.width}px` : undefined, maxWidth: "100%" }}
        className={selected ? "ring-2 ring-blue-500 ring-offset-1" : ""}
      />
      {selected && (
        <div className="absolute top-full left-0 mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg z-10">
          <label className="text-xs text-gray-500 whitespace-nowrap">Largura (px)</label>
          <input
            type="number"
            value={largura}
            onChange={(e) => setLargura(e.target.value)}
            onBlur={aplicar}
            onKeyDown={(e) => e.key === "Enter" && aplicar()}
            placeholder="auto"
            className="w-20 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">px</span>
          {[100, 150, 200, 300].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setLargura(String(v)); updateAttributes({ width: v }) }}
              className="text-xs text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 hover:border-blue-400 transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export type EditorAssinaturaRef = {
  getHTML: () => string
  setContent: (html: string) => void
  isEmpty: () => boolean
}

export const EditorAssinatura = forwardRef<EditorAssinaturaRef, { conteudoInicial?: string }>(
  function EditorAssinatura({ conteudoInicial = "" }, ref) {
    const inputImagemRef = useRef<HTMLInputElement>(null)

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        ImagemRedimensionavel.configure({ inline: false, allowBase64: true }),
      ],
      content: conteudoInicial,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "min-h-[160px] p-4 focus:outline-none text-sm text-gray-800 leading-relaxed",
        },
      },
    })

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? "",
      setContent: (html: string) => { editor?.commands.setContent(html) },
      isEmpty: () => editor?.isEmpty ?? true,
    }))

    function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
      const arquivo = e.target.files?.[0]
      if (!arquivo || !editor) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result as string
        if (src) editor.chain().focus().setImage({ src } as any).run()
      }
      reader.readAsDataURL(arquivo)
      e.target.value = ""
    }

    if (!editor) return null

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
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
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            type="button"
            title="Inserir imagem"
            onClick={() => inputImagemRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input ref={inputImagemRef} type="file" accept="image/*" className="hidden" onChange={handleImagem} />
          <span className="text-xs text-gray-400 ml-1">Clique na imagem para redimensionar</span>
        </div>
        <EditorContent editor={editor} />
      </div>
    )
  }
)

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
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
        ativo ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  )
}
