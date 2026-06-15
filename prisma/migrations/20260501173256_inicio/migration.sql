-- CreateEnum
CREATE TYPE "Cargo" AS ENUM ('ADM', 'HC');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('PENDENTE', 'ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "OrigemChamado" AS ENUM ('RECEBIDO', 'INICIADO');

-- CreateEnum
CREATE TYPE "DirecaoMensagem" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TipoDestinatario" AS ENUM ('PARA', 'CC', 'CCO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cargo" "Cargo" NOT NULL DEFAULT 'HC',
    "status" "StatusUsuario" NOT NULL DEFAULT 'PENDENTE',
    "microsoftId" TEXT,
    "imagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenVerificacao" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "empresa" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "rede" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaEmail" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "conteudoHtml" TEXT NOT NULL,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssinaturaEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateEmail" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "conteudoHtml" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColunaKanban" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6366f1',
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColunaKanban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtribuicaoCategoria" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "usuarioId" TEXT,

    CONSTRAINT "AtribuicaoCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prioridade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "horasSla" INTEGER NOT NULL DEFAULT 8,
    "cor" TEXT NOT NULL DEFAULT '#f59e0b',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prioridade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamado" (
    "id" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "responsavelId" TEXT,
    "colunaId" TEXT NOT NULL,
    "colunaAnteriorId" TEXT,
    "prioridadeId" TEXT,
    "categoriaId" TEXT,
    "threadId" TEXT,
    "prazoSla" TIMESTAMP(3),
    "origem" "OrigemChamado" NOT NULL DEFAULT 'RECEBIDO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteChamado" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoDestinatario" NOT NULL,
    "adicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adicionadoPorId" TEXT,
    "removidoEm" TIMESTAMP(3),

    CONSTRAINT "ParticipanteChamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemEmail" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "deEmail" TEXT NOT NULL,
    "deNome" TEXT,
    "conteudoHtml" TEXT NOT NULL,
    "direcao" "DirecaoMensagem" NOT NULL,
    "encaminhamento" BOOLEAN NOT NULL DEFAULT false,
    "graphMensagemId" TEXT,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinatarioMensagem" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "tipo" "TipoDestinatario" NOT NULL,

    CONSTRAINT "DestinatarioMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoMensagem" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "urlArmazenamento" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnexoMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_microsoftId_key" ON "Usuario"("microsoftId");

-- CreateIndex
CREATE UNIQUE INDEX "Conta_provider_providerAccountId_key" ON "Conta"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_sessionToken_key" ON "Sessao"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "TokenVerificacao_token_key" ON "TokenVerificacao"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TokenVerificacao_identifier_token_key" ON "TokenVerificacao"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AtribuicaoCategoria_categoriaId_usuarioId_key" ON "AtribuicaoCategoria"("categoriaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Chamado_threadId_key" ON "Chamado"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipanteChamado_chamadoId_clienteId_tipo_key" ON "ParticipanteChamado"("chamadoId", "clienteId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "MensagemEmail_graphMensagemId_key" ON "MensagemEmail"("graphMensagemId");

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaEmail" ADD CONSTRAINT "AssinaturaEmail_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtribuicaoCategoria" ADD CONSTRAINT "AtribuicaoCategoria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_colunaId_fkey" FOREIGN KEY ("colunaId") REFERENCES "ColunaKanban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_prioridadeId_fkey" FOREIGN KEY ("prioridadeId") REFERENCES "Prioridade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteChamado" ADD CONSTRAINT "ParticipanteChamado_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteChamado" ADD CONSTRAINT "ParticipanteChamado_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteChamado" ADD CONSTRAINT "ParticipanteChamado_adicionadoPorId_fkey" FOREIGN KEY ("adicionadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemEmail" ADD CONSTRAINT "MensagemEmail_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinatarioMensagem" ADD CONSTRAINT "DestinatarioMensagem_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "MensagemEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnexoMensagem" ADD CONSTRAINT "AnexoMensagem_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "MensagemEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
