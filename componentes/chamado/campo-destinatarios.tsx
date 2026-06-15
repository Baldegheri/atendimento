"use client"

import { useState, KeyboardEvent, useRef, useEffect } from "react"

type Sugestao = { email: string; nome: string | null }

export function CampoDestinatarios({
  label,
  emails,
  onChange,
}: {
  label: string
  emails: string[]
  onChange: (emails: string[]) => void
}) {
  const [input, setInput] = useState("")
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (input.length < 2) {
      setSugestoes([])
      setIndiceSelecionado(-1)
      return
    }
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/clientes/buscar?q=${encodeURIComponent(input)}`)
      if (!res.ok) return
      const dados: Sugestao[] = await res.json()
      setSugestoes(dados.filter((s) => !emails.includes(s.email)))
      setIndiceSelecionado(-1)
    }, 200)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [input, emails])

  function adicionar(valor: string = input) {
    const email = valor.trim().toLowerCase()
    if (email && email.includes("@") && !emails.includes(email)) {
      onChange([...emails, email])
    }
    setInput("")
    setSugestoes([])
    setIndiceSelecionado(-1)
  }

  function selecionarSugestao(sugestao: Sugestao) {
    if (!emails.includes(sugestao.email)) {
      onChange([...emails, sugestao.email])
    }
    setInput("")
    setSugestoes([])
    setIndiceSelecionado(-1)
    inputRef.current?.focus()
  }

  function remover(email: string) {
    onChange(emails.filter((e) => e !== email))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (sugestoes.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setIndiceSelecionado((prev) => Math.min(prev + 1, sugestoes.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setIndiceSelecionado((prev) => Math.max(prev - 1, -1))
        return
      }
      if (e.key === "Escape") {
        setSugestoes([])
        setIndiceSelecionado(-1)
        return
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (indiceSelecionado >= 0 && sugestoes[indiceSelecionado]) {
        selecionarSugestao(sugestoes[indiceSelecionado])
      } else {
        adicionar()
      }
    } else if (e.key === "Backspace" && !input && emails.length > 0) {
      remover(emails[emails.length - 1])
    }
  }

  return (
    <div className="relative flex items-start gap-2 flex-1 cursor-text" onClick={() => inputRef.current?.focus()}>
      <span className="text-xs font-semibold text-gray-400 pt-1 flex-shrink-0 w-6">{label}</span>
      <div className="flex flex-wrap gap-1 flex-1 min-h-[24px]">
        {emails.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
          >
            {email}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remover(email) }}
              className="text-blue-400 hover:text-blue-700 font-bold leading-none ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => {
              setSugestoes([])
              setIndiceSelecionado(-1)
            }, 150)
          }}
          placeholder={emails.length === 0 ? "Adicionar e-mail..." : ""}
          className="flex-1 min-w-[140px] text-xs text-gray-700 outline-none bg-transparent py-0.5"
        />
      </div>

      {sugestoes.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {sugestoes.map((s, i) => (
            <button
              key={s.email}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selecionarSugestao(s) }}
              className={`w-full text-left px-3 py-2 text-xs flex items-baseline gap-2 transition-colors ${
                i === indiceSelecionado ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              {s.nome && <span className="font-medium text-gray-800">{s.nome}</span>}
              <span className="text-gray-500">{s.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
