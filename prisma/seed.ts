import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adaptador = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: adaptador })

async function main() {
  const quantidadeColunas = await prisma.colunaKanban.count()

  if (quantidadeColunas === 0) {
    await prisma.colunaKanban.createMany({
      data: [
        { nome: "Novo", ordem: 1, cor: "#6366f1", padrao: true, resolvido: false },
        { nome: "Atribuído", ordem: 2, cor: "#f59e0b", padrao: false, resolvido: false },
        { nome: "Em Atendimento", ordem: 3, cor: "#3b82f6", padrao: false, resolvido: false },
        { nome: "Aguardando Cliente", ordem: 4, cor: "#8b5cf6", padrao: false, resolvido: false },
        { nome: "Resolvido", ordem: 5, cor: "#10b981", padrao: false, resolvido: true },
      ],
    })
    console.log("✅ Colunas criadas")
  } else {
    console.log("ℹ️  Colunas já existem, pulando...")
  }

  const quantidadePrioridades = await prisma.prioridade.count()

  if (quantidadePrioridades === 0) {
    await prisma.prioridade.createMany({
      data: [
        { nome: "Baixa", horasSla: 24, cor: "#6b7280", ordem: 1 },
        { nome: "Normal", horasSla: 8, cor: "#3b82f6", ordem: 2 },
        { nome: "Alta", horasSla: 4, cor: "#f59e0b", ordem: 3 },
        { nome: "Urgente", horasSla: 2, cor: "#ef4444", ordem: 4 },
      ],
    })
    console.log("✅ Prioridades criadas")
  } else {
    console.log("ℹ️  Prioridades já existem, pulando...")
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
