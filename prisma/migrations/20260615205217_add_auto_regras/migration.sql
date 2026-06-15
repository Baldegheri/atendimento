-- CreateTable
CREATE TABLE "AutoRegra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "gatilho" TEXT NOT NULL,
    "operador" TEXT NOT NULL DEFAULT 'E',
    "departamentoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoRegra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CondicaoAutoRegra" (
    "id" TEXT NOT NULL,
    "regraId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "CondicaoAutoRegra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcaoAutoRegra" (
    "id" TEXT NOT NULL,
    "regraId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "AcaoAutoRegra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoRegra_departamentoId_gatilho_ativo_idx" ON "AutoRegra"("departamentoId", "gatilho", "ativo");

-- AddForeignKey
ALTER TABLE "AutoRegra" ADD CONSTRAINT "AutoRegra_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondicaoAutoRegra" ADD CONSTRAINT "CondicaoAutoRegra_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "AutoRegra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcaoAutoRegra" ADD CONSTRAINT "AcaoAutoRegra_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "AutoRegra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
