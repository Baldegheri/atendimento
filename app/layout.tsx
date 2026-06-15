import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ProvedorSessao } from "@/componentes/provedor-sessao"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: "Sistema de Atendimento",
  description: "Gestão de chamados via e-mail",
}

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-gray-50 dark:bg-gray-950">
        <ProvedorSessao>{children}</ProvedorSessao>
      </body>
    </html>
  )
}
