-- CreateTable
CREATE TABLE "gift_cards" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "codigo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "quantidadeMusicas" INTEGER NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataExpiracao" DATETIME,
    "usadoEm" DATETIME,
    "usadoPor" TEXT,
    "pedidoMusicaId" TEXT,
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "gift_cards_pedidoMusicaId_fkey" FOREIGN KEY ("pedidoMusicaId") REFERENCES "pedidos_musica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_codigo_key" ON "gift_cards"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_pedidoMusicaId_key" ON "gift_cards"("pedidoMusicaId");

-- CreateIndex
CREATE INDEX "gift_cards_codigo_idx" ON "gift_cards"("codigo");

-- CreateIndex
CREATE INDEX "gift_cards_usado_idx" ON "gift_cards"("usado");

-- CreateIndex
CREATE INDEX "gift_cards_ativo_idx" ON "gift_cards"("ativo");
