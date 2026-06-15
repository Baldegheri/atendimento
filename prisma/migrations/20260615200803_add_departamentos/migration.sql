-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "departamentoId" TEXT;

-- AlterTable
ALTER TABLE "Chamado" ADD COLUMN     "departamentoId" TEXT;

-- AlterTable
ALTER TABLE "ColunaKanban" ADD COLUMN     "departamentoId" TEXT;

-- AlterTable
ALTER TABLE "HorarioAtendimento" ADD COLUMN     "departamentoId" TEXT;

-- AlterTable
ALTER TABLE "Prioridade" ADD COLUMN     "departamentoId" TEXT;

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#3b82f6',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembroDepartamento" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "adicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembroDepartamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembroDepartamento_usuarioId_departamentoId_key" ON "MembroDepartamento"("usuarioId", "departamentoId");

-- AddForeignKey
ALTER TABLE "MembroDepartamento" ADD CONSTRAINT "MembroDepartamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroDepartamento" ADD CONSTRAINT "MembroDepartamento_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColunaKanban" ADD CONSTRAINT "ColunaKanban_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioAtendimento" ADD CONSTRAINT "HorarioAtendimento_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prioridade" ADD CONSTRAINT "Prioridade_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
