-- CreateTable
CREATE TABLE "carrinhos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "nomeCliente" TEXT,
    "musicasTitulos" TEXT NOT NULL,
    "musicasIds" TEXT NOT NULL,
    "musicasThumbs" TEXT NOT NULL,
    "musicasDuracoes" TEXT NOT NULL,
    "valorTotal" REAL NOT NULL,
    "quantidadeItens" INTEGER NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 1,
    "resetaEm" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pedidos_musica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeCliente" TEXT,
    "musicaTitulo" TEXT NOT NULL,
    "musicaYoutubeId" TEXT NOT NULL,
    "musicaThumbnail" TEXT,
    "musicaDuracao" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "valor" REAL NOT NULL,
    "pagamentoId" TEXT,
    "pagamentoCarrinhoId" TEXT,
    "posicaoFila" INTEGER,
    "motivoRejeicao" TEXT,
    "moderadoPor" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "pedidos_musica_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pedidos_musica_pagamentoCarrinhoId_fkey" FOREIGN KEY ("pagamentoCarrinhoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pedidos_musica" ("atualizadoEm", "criadoEm", "id", "moderadoPor", "motivoRejeicao", "musicaDuracao", "musicaThumbnail", "musicaTitulo", "musicaYoutubeId", "nomeCliente", "pagamentoId", "posicaoFila", "status", "valor") SELECT "atualizadoEm", "criadoEm", "id", "moderadoPor", "motivoRejeicao", "musicaDuracao", "musicaThumbnail", "musicaTitulo", "musicaYoutubeId", "nomeCliente", "pagamentoId", "posicaoFila", "status", "valor" FROM "pedidos_musica";
DROP TABLE "pedidos_musica";
ALTER TABLE "new_pedidos_musica" RENAME TO "pedidos_musica";
CREATE UNIQUE INDEX "pedidos_musica_pagamentoId_key" ON "pedidos_musica"("pagamentoId");
CREATE INDEX "pedidos_musica_status_idx" ON "pedidos_musica"("status");
CREATE INDEX "pedidos_musica_criadoEm_idx" ON "pedidos_musica"("criadoEm");
CREATE INDEX "pedidos_musica_pagamentoCarrinhoId_idx" ON "pedidos_musica"("pagamentoCarrinhoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "carrinhos_sessionId_idx" ON "carrinhos"("sessionId");

-- CreateIndex
CREATE INDEX "carrinhos_expiraEm_idx" ON "carrinhos"("expiraEm");

-- CreateIndex
CREATE INDEX "rate_limits_ip_idx" ON "rate_limits"("ip");

-- CreateIndex
CREATE INDEX "rate_limits_resetaEm_idx" ON "rate_limits"("resetaEm");
