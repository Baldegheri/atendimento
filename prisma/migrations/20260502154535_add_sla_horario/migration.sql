-- AlterTable
ALTER TABLE "Chamado" ADD COLUMN     "slaPausadoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HorarioAtendimento" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL DEFAULT '08:00',
    "horaFim" TEXT NOT NULL DEFAULT '18:00',
    "ativo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HorarioAtendimento_pkey" PRIMARY KEY ("id")
);
