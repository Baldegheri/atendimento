import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })

const adaptador = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: adaptador })

async function main() {
  console.log("🏢 Criando departamento padrão 'Inovação e Tecnologia'...")

  let dept = await prisma.departamento.findFirst({
    where: { nome: "Inovação e Tecnologia" },
  })

  if (!dept) {
    dept = await prisma.departamento.create({
      data: { nome: "Inovação e Tecnologia", cor: "#3b82f6", descricao: "Time de tecnologia e inovação" },
    })
    console.log(`  ✓ Departamento criado: ${dept.id}`)
  } else {
    console.log(`  → Departamento já existe: ${dept.id}`)
  }

  console.log("📋 Migrando colunas do kanban...")
  const cols = await prisma.colunaKanban.updateMany({
    where: { departamentoId: null },
    data: { departamentoId: dept.id },
  })
  console.log(`  ✓ ${cols.count} coluna(s) migrada(s)`)

  console.log("🏷️ Migrando categorias...")
  const cats = await prisma.categoria.updateMany({
    where: { departamentoId: null },
    data: { departamentoId: dept.id },
  })
  console.log(`  ✓ ${cats.count} categoria(s) migrada(s)`)

  console.log("⚡ Migrando prioridades...")
  const prios = await prisma.prioridade.updateMany({
    where: { departamentoId: null },
    data: { departamentoId: dept.id },
  })
  console.log(`  ✓ ${prios.count} prioridade(s) migrada(s)`)

  console.log("🕐 Migrando horários de atendimento...")
  const hors = await prisma.horarioAtendimento.updateMany({
    where: { departamentoId: null },
    data: { departamentoId: dept.id },
  })
  console.log(`  ✓ ${hors.count} horário(s) migrado(s)`)

  console.log("📬 Migrando chamados...")
  const chs = await prisma.chamado.updateMany({
    where: { departamentoId: null },
    data: { departamentoId: dept.id },
  })
  console.log(`  ✓ ${chs.count} chamado(s) migrado(s)`)

  console.log("👥 Adicionando usuários ativos como membros...")
  const usuarios = await prisma.usuario.findMany({ where: { status: "ATIVO" } })
  let adicionados = 0
  for (const u of usuarios) {
    await prisma.membroDepartamento.upsert({
      where: { usuarioId_departamentoId: { usuarioId: u.id, departamentoId: dept.id } },
      update: {},
      create: { usuarioId: u.id, departamentoId: dept.id },
    })
    adicionados++
  }
  console.log(`  ✓ ${adicionados} usuário(s) adicionado(s) como membros`)

  console.log("\n✅ Migração concluída!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
