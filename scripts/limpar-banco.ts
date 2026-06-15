import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adaptador = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: adaptador })

async function limpar() {
  console.log("Limpando banco de dados...")

  const mensagens = await prisma.mensagemEmail.deleteMany()
  console.log(`  ${mensagens.count} mensagens deletadas`)

  const participantes = await prisma.participanteChamado.deleteMany()
  console.log(`  ${participantes.count} participantes deletados`)

  const chamados = await prisma.chamado.deleteMany()
  console.log(`  ${chamados.count} chamados deletados`)

  const clientes = await prisma.cliente.deleteMany()
  console.log(`  ${clientes.count} clientes deletados`)

  console.log("Banco limpo!")
  await prisma.$disconnect()
}

limpar().catch((e) => {
  console.error(e)
  process.exit(1)
})
