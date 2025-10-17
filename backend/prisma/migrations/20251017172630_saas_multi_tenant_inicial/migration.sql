/*
  Warnings:

  - Added the required column `estabelecimentoId` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `carrinhos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `configuracoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `estado_player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `gift_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `historico_buscas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `pagamentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `palavras_proibidas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `pedidos_musica` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `sugestoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estabelecimentoId` to the `temas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "estabelecimentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "plano" TEXT NOT NULL DEFAULT 'basico',
    "dataExpiracao" DATETIME,
    "limiteTVs" INTEGER NOT NULL DEFAULT 2,
    "limiteMusicasMes" INTEGER NOT NULL DEFAULT 1000,
    "totalMusicasMes" INTEGER NOT NULL DEFAULT 0,
    "ultimoResetMes" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminNome" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "adminTelefone" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tvs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "ultimaConexao" DATETIME,
    "ipUltimaConexao" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "tvs_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" DATETIME,
    "permissoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "admins_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_admins" ("ativo", "atualizadoEm", "criadoEm", "id", "nome", "password", "ultimoAcesso", "username") SELECT "ativo", "atualizadoEm", "criadoEm", "id", "nome", "password", "ultimoAcesso", "username" FROM "admins";
DROP TABLE "admins";
ALTER TABLE "new_admins" RENAME TO "admins";
CREATE INDEX "admins_estabelecimentoId_idx" ON "admins"("estabelecimentoId");
CREATE UNIQUE INDEX "admins_estabelecimentoId_username_key" ON "admins"("estabelecimentoId", "username");
CREATE TABLE "new_carrinhos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
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
    CONSTRAINT "carrinhos_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_carrinhos" ("atualizadoEm", "criadoEm", "expiraEm", "id", "musicasDuracoes", "musicasIds", "musicasThumbs", "musicasTitulos", "nomeCliente", "quantidadeItens", "sessionId", "valorTotal") SELECT "atualizadoEm", "criadoEm", "expiraEm", "id", "musicasDuracoes", "musicasIds", "musicasThumbs", "musicasTitulos", "nomeCliente", "quantidadeItens", "sessionId", "valorTotal" FROM "carrinhos";
DROP TABLE "carrinhos";
ALTER TABLE "new_carrinhos" RENAME TO "carrinhos";
CREATE INDEX "carrinhos_estabelecimentoId_idx" ON "carrinhos"("estabelecimentoId");
CREATE INDEX "carrinhos_sessionId_idx" ON "carrinhos"("sessionId");
CREATE INDEX "carrinhos_expiraEm_idx" ON "carrinhos"("expiraEm");
CREATE TABLE "new_configuracoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "configuracoes_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_configuracoes" ("atualizadoEm", "chave", "criadoEm", "descricao", "id", "tipo", "valor") SELECT "atualizadoEm", "chave", "criadoEm", "descricao", "id", "tipo", "valor" FROM "configuracoes";
DROP TABLE "configuracoes";
ALTER TABLE "new_configuracoes" RENAME TO "configuracoes";
CREATE INDEX "configuracoes_estabelecimentoId_idx" ON "configuracoes"("estabelecimentoId");
CREATE UNIQUE INDEX "configuracoes_estabelecimentoId_chave_key" ON "configuracoes"("estabelecimentoId", "chave");
CREATE TABLE "new_estado_player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "musicaAtualId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "tempoAtual" REAL NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 80,
    "ultimaAtualizacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "estado_player_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_estado_player" ("atualizadoEm", "criadoEm", "id", "musicaAtualId", "status", "tempoAtual", "ultimaAtualizacao", "volume") SELECT "atualizadoEm", "criadoEm", "id", "musicaAtualId", "status", "tempoAtual", "ultimaAtualizacao", "volume" FROM "estado_player";
DROP TABLE "estado_player";
ALTER TABLE "new_estado_player" RENAME TO "estado_player";
CREATE UNIQUE INDEX "estado_player_estabelecimentoId_key" ON "estado_player"("estabelecimentoId");
CREATE INDEX "estado_player_estabelecimentoId_idx" ON "estado_player"("estabelecimentoId");
CREATE TABLE "new_gift_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
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
    CONSTRAINT "gift_cards_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gift_cards_pedidoMusicaId_fkey" FOREIGN KEY ("pedidoMusicaId") REFERENCES "pedidos_musica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_gift_cards" ("ativo", "atualizadoEm", "codigo", "criadoEm", "dataExpiracao", "id", "observacao", "pedidoMusicaId", "quantidadeMusicas", "usado", "usadoEm", "usadoPor", "valor") SELECT "ativo", "atualizadoEm", "codigo", "criadoEm", "dataExpiracao", "id", "observacao", "pedidoMusicaId", "quantidadeMusicas", "usado", "usadoEm", "usadoPor", "valor" FROM "gift_cards";
DROP TABLE "gift_cards";
ALTER TABLE "new_gift_cards" RENAME TO "gift_cards";
CREATE UNIQUE INDEX "gift_cards_codigo_key" ON "gift_cards"("codigo");
CREATE UNIQUE INDEX "gift_cards_pedidoMusicaId_key" ON "gift_cards"("pedidoMusicaId");
CREATE INDEX "gift_cards_estabelecimentoId_idx" ON "gift_cards"("estabelecimentoId");
CREATE INDEX "gift_cards_codigo_idx" ON "gift_cards"("codigo");
CREATE TABLE "new_historico_buscas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    "categoria" TEXT,
    "resultados" INTEGER NOT NULL DEFAULT 0,
    "vezesBuscado" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "historico_buscas_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_historico_buscas" ("atualizadoEm", "categoria", "criadoEm", "id", "resultados", "termo", "vezesBuscado") SELECT "atualizadoEm", "categoria", "criadoEm", "id", "resultados", "termo", "vezesBuscado" FROM "historico_buscas";
DROP TABLE "historico_buscas";
ALTER TABLE "new_historico_buscas" RENAME TO "historico_buscas";
CREATE INDEX "historico_buscas_estabelecimentoId_idx" ON "historico_buscas"("estabelecimentoId");
CREATE INDEX "historico_buscas_termo_idx" ON "historico_buscas"("termo");
CREATE TABLE "new_pagamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
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
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "pagamentos_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_pagamentos" ("atualizadoEm", "cpfPagador", "criadoEm", "emailPagador", "id", "lastWebhookUpdate", "mercadoPagoPaymentId", "mercadoPagoPreferenceId", "metodoPagamento", "nomePagador", "pixExpirationDate", "qrCode", "qrCodeText", "status", "valor", "webhookData") SELECT "atualizadoEm", "cpfPagador", "criadoEm", "emailPagador", "id", "lastWebhookUpdate", "mercadoPagoPaymentId", "mercadoPagoPreferenceId", "metodoPagamento", "nomePagador", "pixExpirationDate", "qrCode", "qrCodeText", "status", "valor", "webhookData" FROM "pagamentos";
DROP TABLE "pagamentos";
ALTER TABLE "new_pagamentos" RENAME TO "pagamentos";
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPaymentId_key" ON "pagamentos"("mercadoPagoPaymentId");
CREATE UNIQUE INDEX "pagamentos_mercadoPagoPreferenceId_key" ON "pagamentos"("mercadoPagoPreferenceId");
CREATE INDEX "pagamentos_estabelecimentoId_idx" ON "pagamentos"("estabelecimentoId");
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");
CREATE TABLE "new_palavras_proibidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "palavra" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'AMBOS',
    "severidade" TEXT NOT NULL DEFAULT 'MEDIA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "palavras_proibidas_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_palavras_proibidas" ("ativo", "atualizadoEm", "categoria", "criadoEm", "id", "palavra", "severidade") SELECT "ativo", "atualizadoEm", "categoria", "criadoEm", "id", "palavra", "severidade" FROM "palavras_proibidas";
DROP TABLE "palavras_proibidas";
ALTER TABLE "new_palavras_proibidas" RENAME TO "palavras_proibidas";
CREATE INDEX "palavras_proibidas_estabelecimentoId_idx" ON "palavras_proibidas"("estabelecimentoId");
CREATE INDEX "palavras_proibidas_categoria_idx" ON "palavras_proibidas"("categoria");
CREATE TABLE "new_pedidos_musica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
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
    CONSTRAINT "pedidos_musica_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pedidos_musica_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pedidos_musica_pagamentoCarrinhoId_fkey" FOREIGN KEY ("pagamentoCarrinhoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pedidos_musica" ("atualizadoEm", "criadoEm", "id", "moderadoPor", "motivoRejeicao", "musicaDuracao", "musicaThumbnail", "musicaTitulo", "musicaYoutubeId", "nomeCliente", "pagamentoCarrinhoId", "pagamentoId", "posicaoFila", "status", "valor") SELECT "atualizadoEm", "criadoEm", "id", "moderadoPor", "motivoRejeicao", "musicaDuracao", "musicaThumbnail", "musicaTitulo", "musicaYoutubeId", "nomeCliente", "pagamentoCarrinhoId", "pagamentoId", "posicaoFila", "status", "valor" FROM "pedidos_musica";
DROP TABLE "pedidos_musica";
ALTER TABLE "new_pedidos_musica" RENAME TO "pedidos_musica";
CREATE UNIQUE INDEX "pedidos_musica_pagamentoId_key" ON "pedidos_musica"("pagamentoId");
CREATE INDEX "pedidos_musica_estabelecimentoId_idx" ON "pedidos_musica"("estabelecimentoId");
CREATE INDEX "pedidos_musica_estabelecimentoId_status_idx" ON "pedidos_musica"("estabelecimentoId", "status");
CREATE INDEX "pedidos_musica_criadoEm_idx" ON "pedidos_musica"("criadoEm");
CREATE TABLE "new_sugestoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "youtubeId" TEXT,
    "thumbnail" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'trending',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "sugestoes_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sugestoes" ("ativo", "atualizadoEm", "categoria", "criadoEm", "id", "ordem", "thumbnail", "tipo", "titulo", "youtubeId") SELECT "ativo", "atualizadoEm", "categoria", "criadoEm", "id", "ordem", "thumbnail", "tipo", "titulo", "youtubeId" FROM "sugestoes";
DROP TABLE "sugestoes";
ALTER TABLE "new_sugestoes" RENAME TO "sugestoes";
CREATE INDEX "sugestoes_estabelecimentoId_idx" ON "sugestoes"("estabelecimentoId");
CREATE INDEX "sugestoes_categoria_ativo_idx" ON "sugestoes"("categoria", "ativo");
CREATE TABLE "new_temas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estabelecimentoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Espeto Music',
    "corPrimaria" TEXT NOT NULL DEFAULT '#DC2626',
    "corSecundaria" TEXT NOT NULL DEFAULT '#F97316',
    "corAcento" TEXT NOT NULL DEFAULT '#FBBF24',
    "corFundo" TEXT NOT NULL DEFAULT '#0F172A',
    "corFundoSecundario" TEXT NOT NULL DEFAULT '#1E293B',
    "corTexto" TEXT NOT NULL DEFAULT '#F8FAFC',
    "corTextoSecundario" TEXT NOT NULL DEFAULT '#CBD5E1',
    "logoUrl" TEXT,
    "backgroundUrl" TEXT,
    "iconUrl" TEXT,
    "fontePrimaria" TEXT NOT NULL DEFAULT 'Inter',
    "fonteSecundaria" TEXT NOT NULL DEFAULT 'Poppins',
    "borderRadius" TEXT NOT NULL DEFAULT '8px',
    "shadowIntensity" TEXT NOT NULL DEFAULT 'medium',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "temas_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "estabelecimentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_temas" ("atualizadoEm", "backgroundUrl", "borderRadius", "corAcento", "corFundo", "corFundoSecundario", "corPrimaria", "corSecundaria", "corTexto", "corTextoSecundario", "criadoEm", "fontePrimaria", "fonteSecundaria", "iconUrl", "id", "logoUrl", "nome", "shadowIntensity") SELECT "atualizadoEm", "backgroundUrl", "borderRadius", "corAcento", "corFundo", "corFundoSecundario", "corPrimaria", "corSecundaria", "corTexto", "corTextoSecundario", "criadoEm", "fontePrimaria", "fonteSecundaria", "iconUrl", "id", "logoUrl", "nome", "shadowIntensity" FROM "temas";
DROP TABLE "temas";
ALTER TABLE "new_temas" RENAME TO "temas";
CREATE UNIQUE INDEX "temas_estabelecimentoId_key" ON "temas"("estabelecimentoId");
CREATE INDEX "temas_estabelecimentoId_idx" ON "temas"("estabelecimentoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_username_key" ON "super_admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "estabelecimentos_slug_key" ON "estabelecimentos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "estabelecimentos_codigo_key" ON "estabelecimentos"("codigo");

-- CreateIndex
CREATE INDEX "estabelecimentos_slug_idx" ON "estabelecimentos"("slug");

-- CreateIndex
CREATE INDEX "estabelecimentos_codigo_idx" ON "estabelecimentos"("codigo");

-- CreateIndex
CREATE INDEX "estabelecimentos_ativo_idx" ON "estabelecimentos"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "tvs_codigo_key" ON "tvs"("codigo");

-- CreateIndex
CREATE INDEX "tvs_estabelecimentoId_idx" ON "tvs"("estabelecimentoId");

-- CreateIndex
CREATE INDEX "tvs_codigo_idx" ON "tvs"("codigo");
