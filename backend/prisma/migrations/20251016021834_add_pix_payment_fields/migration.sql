-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN "cpfPagador" TEXT;
ALTER TABLE "pagamentos" ADD COLUMN "lastWebhookUpdate" DATETIME;
ALTER TABLE "pagamentos" ADD COLUMN "nomePagador" TEXT;
ALTER TABLE "pagamentos" ADD COLUMN "pixExpirationDate" DATETIME;
ALTER TABLE "pagamentos" ADD COLUMN "qrCode" TEXT;
ALTER TABLE "pagamentos" ADD COLUMN "qrCodeText" TEXT;
ALTER TABLE "pagamentos" ADD COLUMN "webhookData" TEXT;

-- CreateIndex
CREATE INDEX "pagamentos_mercadoPagoPaymentId_idx" ON "pagamentos"("mercadoPagoPaymentId");
