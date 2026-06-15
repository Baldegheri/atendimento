import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { sincronizarEmails } from "../lib/email/sincronizar"

const adaptador = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: adaptador })

const INTERVALO_MS = 60 * 1000

async function executarPolling() {
  try {
    await sincronizarEmails()
  } catch (erro) {
    console.error("[polling] Erro durante sincronização:", erro)
  }
}

console.log("[polling] Iniciando serviço de e-mail (intervalo: 60s)")

executarPolling()
setInterval(executarPolling, INTERVALO_MS)

process.on("SIGINT", async () => {
  console.log("[polling] Encerrando...")
  await prisma.$disconnect()
  process.exit(0)
})
