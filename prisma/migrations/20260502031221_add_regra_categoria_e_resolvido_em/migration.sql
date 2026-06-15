-- AlterTable
ALTER TABLE "Chamado" ADD COLUMN     "resolvidoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RegraCategoria" (
    "id" TEXT NOT NULL,
    "palavraChave" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegraCategoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RegraCategoria" ADD CONSTRAINT "RegraCategoria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
