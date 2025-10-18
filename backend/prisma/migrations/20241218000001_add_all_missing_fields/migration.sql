-- AlterTable - Adicionar campos faltantes em pedidos_musica
ALTER TABLE "pedidos_musica" ADD COLUMN "pagamentoCarrinhoId" TEXT;
ALTER TABLE "pedidos_musica" ADD COLUMN "prioridade" BOOLEAN DEFAULT false;
ALTER TABLE "pedidos_musica" ADD COLUMN "dedicatoria" TEXT;
ALTER TABLE "pedidos_musica" ADD COLUMN "dedicatoriaDe" TEXT;

-- CreateIndex
CREATE INDEX "pedidos_musica_prioridade_idx" ON "pedidos_musica"("prioridade");