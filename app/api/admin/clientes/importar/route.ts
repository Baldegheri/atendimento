import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Papa from "papaparse"

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao || sessao.user.cargo !== "ADM") return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const fd = await req.formData()
  const arquivo = fd.get("arquivo") as File | null
  if (!arquivo) return NextResponse.json({ erro: "Arquivo não enviado" }, { status: 400 })

  const texto = await arquivo.text()
  const { data } = Papa.parse<Record<string, string>>(texto, { header: true, skipEmptyLines: true })

  let importados = 0
  let ignorados = 0

  for (const linha of data) {
    const email = linha["email"]?.trim().toLowerCase()
    if (!email) { ignorados++; continue }

    try {
      await prisma.cliente.upsert({
        where: { email },
        update: {
          nome: linha["nome"]?.trim() || undefined,
          empresa: linha["empresa"]?.trim() || undefined,
          telefone: linha["telefone"]?.trim() || undefined,
        },
        create: {
          email,
          nome: linha["nome"]?.trim() || null,
          empresa: linha["empresa"]?.trim() || null,
          telefone: linha["telefone"]?.trim() || null,
        },
      })
      importados++
    } catch {
      ignorados++
    }
  }

  return NextResponse.json({ importados, ignorados })
}
