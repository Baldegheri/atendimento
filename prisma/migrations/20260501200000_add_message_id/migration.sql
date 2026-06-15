-- AlterTable
ALTER TABLE "MensagemEmail" ADD COLUMN "messageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MensagemEmail_messageId_key" ON "MensagemEmail"("messageId");
