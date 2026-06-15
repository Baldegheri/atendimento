import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function criarPrisma() {
  const adaptador = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter: adaptador })
}

export const prisma = globalForPrisma.prisma || criarPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
