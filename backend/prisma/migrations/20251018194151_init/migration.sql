-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" DATETIME,
    "permissoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pedidos_musica" (
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
    "prioridade" BOOLEAN NOT NULL DEFAULT false,
    "dedicatoria" TEXT,
    "dedicatoriaDe" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "pedidos_musica_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mercadoPagoPaymentId" TEXT,
    "mercadoPagoPreferenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "valor" REAL NOT NULL,
    "metodoPagamento" TEXT,
    "emailPagador" TEXT,
    "cpfPagador" TEXT,
    "nomePagador" TEXT,
    "qrCode" TEXT,
    "qrCodeText" TEXT,
    "pixExpirationDate" DATETIME,
    "webhookData" TEXT,
    "lastWebhookUpdate" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "estado_player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musicaAtualId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "tempoAtual" REAL NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 80,
    "ultimaAtualizacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "gift_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
CREATE TABLE "sugestoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "youtubeId" TEXT,
    "thumbnail" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'trending',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "historico_buscas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "termo" TEXT NOT NULL,
    "categoria" TEXT,
    "resultados" INTEGER NOT NULL DEFAULT 0,
    "vezesBuscado" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "palavras_proibidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "palavra" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'AMBOS',
    "severidade" TEXT NOT NULL DEFAULT 'MEDIA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
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

-- CreateTable
CREATE TABLE "historico_musicas" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_musica_pagamentoId_key" ON "pedidos_musica"("pagamentoId");

-- CreateIndex
CREATE INDEX "pedidos_musica_criadoEm_idx" ON "pedidos_musica"("criadoEm");

-- CreateIndex
CREATE INDEX "pedidos_musica_status_idx" ON "pedidos_musica"("status");

-- CreateIndex
CREATE INDEX "pedidos_musica_prioridade_idx" ON "pedidos_musica"("prioridade");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPaymentId_key" ON "pagamentos"("mercadoPagoPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPreferenceId_key" ON "pagamentos"("mercadoPagoPreferenceId");

-- CreateIndex
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_codigo_key" ON "gift_cards"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_pedidoMusicaId_key" ON "gift_cards"("pedidoMusicaId");

-- CreateIndex
CREATE INDEX "gift_cards_codigo_idx" ON "gift_cards"("codigo");

-- CreateIndex
CREATE INDEX "carrinhos_expiraEm_idx" ON "carrinhos"("expiraEm");

-- CreateIndex
CREATE INDEX "carrinhos_sessionId_idx" ON "carrinhos"("sessionId");

-- CreateIndex
CREATE INDEX "sugestoes_categoria_ativo_idx" ON "sugestoes"("categoria", "ativo");

-- CreateIndex
CREATE INDEX "historico_buscas_termo_idx" ON "historico_buscas"("termo");

-- CreateIndex
CREATE INDEX "palavras_proibidas_categoria_idx" ON "palavras_proibidas"("categoria");

-- CreateIndex
CREATE INDEX "rate_limits_resetaEm_idx" ON "rate_limits"("resetaEm");

-- CreateIndex
CREATE INDEX "rate_limits_ip_idx" ON "rate_limits"("ip");

-- CreateIndex
CREATE INDEX "historico_musicas_inicioReproducao_idx" ON "historico_musicas"("inicioReproducao");

-- CreateIndex
CREATE INDEX "historico_musicas_tipo_idx" ON "historico_musicas"("tipo");
