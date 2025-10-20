-- CreateTable
CREATE TABLE "locacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "nomeEvento" TEXT NOT NULL,
    "emailContato" TEXT,
    "telefoneContato" TEXT,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "nomeEstabelecimento" TEXT,
    "logoUrl" TEXT,
    "corTema" TEXT,
    "mensagemBoasVindas" TEXT,
    "backgroundImageUrl" TEXT,
    "qrCodeData" TEXT,
    "configuracoes" TEXT,
    "totalPedidos" INTEGER NOT NULL DEFAULT 0,
    "totalArrecadado" REAL NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "historico_musicas_locacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locacaoId" TEXT,
    "pedidoMusicaId" TEXT,
    "musicaTitulo" TEXT NOT NULL,
    "musicaYoutubeId" TEXT NOT NULL,
    "musicaThumbnail" TEXT,
    "musicaDuracao" INTEGER,
    "nomeCliente" TEXT,
    "valor" REAL NOT NULL DEFAULT 0,
    "inicioReproducao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimReproducao" DATETIME,
    "duracaoTocada" INTEGER,
    "tipo" TEXT NOT NULL DEFAULT 'cliente',
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historico_musicas_locacao_locacaoId_fkey" FOREIGN KEY ("locacaoId") REFERENCES "locacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_carrinhos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locacaoId" TEXT,
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
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "carrinhos_locacaoId_fkey" FOREIGN KEY ("locacaoId") REFERENCES "locacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_carrinhos" ("atualizadoEm", "criadoEm", "expiraEm", "id", "musicasDuracoes", "musicasIds", "musicasThumbs", "musicasTitulos", "nomeCliente", "quantidadeItens", "sessionId", "valorTotal") SELECT "atualizadoEm", "criadoEm", "expiraEm", "id", "musicasDuracoes", "musicasIds", "musicasThumbs", "musicasTitulos", "nomeCliente", "quantidadeItens", "sessionId", "valorTotal" FROM "carrinhos";
DROP TABLE "carrinhos";
ALTER TABLE "new_carrinhos" RENAME TO "carrinhos";
CREATE INDEX "carrinhos_locacaoId_idx" ON "carrinhos"("locacaoId");
CREATE INDEX "carrinhos_expiraEm_idx" ON "carrinhos"("expiraEm");
CREATE INDEX "carrinhos_sessionId_idx" ON "carrinhos"("sessionId");
CREATE TABLE "new_gift_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locacaoId" TEXT,
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
    CONSTRAINT "gift_cards_pedidoMusicaId_fkey" FOREIGN KEY ("pedidoMusicaId") REFERENCES "pedidos_musica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "gift_cards_locacaoId_fkey" FOREIGN KEY ("locacaoId") REFERENCES "locacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_gift_cards" ("ativo", "atualizadoEm", "codigo", "criadoEm", "dataExpiracao", "id", "observacao", "pedidoMusicaId", "quantidadeMusicas", "usado", "usadoEm", "usadoPor", "valor") SELECT "ativo", "atualizadoEm", "codigo", "criadoEm", "dataExpiracao", "id", "observacao", "pedidoMusicaId", "quantidadeMusicas", "usado", "usadoEm", "usadoPor", "valor" FROM "gift_cards";
DROP TABLE "gift_cards";
ALTER TABLE "new_gift_cards" RENAME TO "gift_cards";
CREATE UNIQUE INDEX "gift_cards_codigo_key" ON "gift_cards"("codigo");
CREATE UNIQUE INDEX "gift_cards_pedidoMusicaId_key" ON "gift_cards"("pedidoMusicaId");
CREATE INDEX "gift_cards_locacaoId_idx" ON "gift_cards"("locacaoId");
CREATE INDEX "gift_cards_codigo_idx" ON "gift_cards"("codigo");
CREATE TABLE "new_pedidos_musica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locacaoId" TEXT,
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
    "prioridade" BOOLEAN NOT NULL DEFAULT false,
    "dedicatoria" TEXT,
    "dedicatoriaDe" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "pedidos_musica_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pedidos_musica_locacaoId_fkey" FOREIGN KEY ("locacaoId") REFERENCES "locacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pedidos_musica" ("atualizadoEm", "criadoEm", "dedicatoria", "dedicatoriaDe", "id", "moderadoPor", "motivoRejeicao", "musicaDuracao", "musicaThumbnail", "musicaTitulo", "musicaYoutubeId", "nomeCliente", "pagamentoCarrinhoId", "pagamentoId", "posicaoFila", "prioridade", "status", "valor") SELECT "atualizadoEm", "criadoEm", "dedicatoria", "dedicatoriaDe", "id", "moderadoPor", "motivoRejeicao", "musicaDuracao", "musicaThumbnail", "musicaTitulo", "musicaYoutubeId", "nomeCliente", "pagamentoCarrinhoId", "pagamentoId", "posicaoFila", "prioridade", "status", "valor" FROM "pedidos_musica";
DROP TABLE "pedidos_musica";
ALTER TABLE "new_pedidos_musica" RENAME TO "pedidos_musica";
CREATE UNIQUE INDEX "pedidos_musica_pagamentoId_key" ON "pedidos_musica"("pagamentoId");
CREATE INDEX "pedidos_musica_locacaoId_idx" ON "pedidos_musica"("locacaoId");
CREATE INDEX "pedidos_musica_criadoEm_idx" ON "pedidos_musica"("criadoEm");
CREATE INDEX "pedidos_musica_status_idx" ON "pedidos_musica"("status");
CREATE INDEX "pedidos_musica_prioridade_idx" ON "pedidos_musica"("prioridade");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "locacoes_slug_key" ON "locacoes"("slug");

-- CreateIndex
CREATE INDEX "locacoes_slug_idx" ON "locacoes"("slug");

-- CreateIndex
CREATE INDEX "locacoes_ativo_idx" ON "locacoes"("ativo");

-- CreateIndex
CREATE INDEX "locacoes_dataInicio_dataFim_idx" ON "locacoes"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "historico_musicas_locacao_locacaoId_idx" ON "historico_musicas_locacao"("locacaoId");

-- CreateIndex
CREATE INDEX "historico_musicas_locacao_inicioReproducao_idx" ON "historico_musicas_locacao"("inicioReproducao");

-- CreateIndex
CREATE INDEX "historico_musicas_locacao_tipo_idx" ON "historico_musicas_locacao"("tipo");
