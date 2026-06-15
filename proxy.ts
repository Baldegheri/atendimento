import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const rotasPublicas = ["/login", "/aguardando-aprovacao"]

export default auth((req) => {
  const { nextUrl, auth: sessao } = req
  const eRotaPublica = rotasPublicas.some((rota) => nextUrl.pathname.startsWith(rota))

  if (!sessao && !eRotaPublica) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (sessao?.user?.status === "PENDENTE" && !eRotaPublica) {
    return NextResponse.redirect(new URL("/aguardando-aprovacao", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
