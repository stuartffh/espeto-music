-- CreateTable
CREATE TABLE "pedidos_musica" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "nomeCliente" TEXT,
    "musicaTitulo" TEXT NOT NULL,
    "musicaYoutubeId" TEXT NOT NULL,
    "musicaThumbnail" TEXT,
    "musicaDuracao" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "valor" REAL NOT NULL,
    "pagamentoId" TEXT,
    "posicaoFila" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "pedidos_musica_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "mercadoPagoPaymentId" TEXT,
    "mercadoPagoPreferenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "valor" REAL NOT NULL,
    "metodoPagamento" TEXT,
    "emailPagador" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_musica_pagamentoId_key" ON "pedidos_musica"("pagamentoId");

-- CreateIndex
CREATE INDEX "pedidos_musica_status_idx" ON "pedidos_musica"("status");

-- CreateIndex
CREATE INDEX "pedidos_musica_criadoEm_idx" ON "pedidos_musica"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPaymentId_key" ON "pagamentos"("mercadoPagoPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPreferenceId_key" ON "pagamentos"("mercadoPagoPreferenceId");

-- CreateIndex
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");
