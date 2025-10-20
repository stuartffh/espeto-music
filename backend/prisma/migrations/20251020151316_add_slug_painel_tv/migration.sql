/*
  Warnings:

  - Added the required column `slugPainelTV` to the `locacoes` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_locacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "slugPainelTV" TEXT NOT NULL,
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
    "videoDescansoUrl" TEXT,
    "qrCodeData" TEXT,
    "configuracoes" TEXT,
    "totalPedidos" INTEGER NOT NULL DEFAULT 0,
    "totalArrecadado" REAL NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_locacoes" ("ativo", "atualizadoEm", "backgroundImageUrl", "configuracoes", "corTema", "criadoEm", "dataFim", "dataInicio", "emailContato", "id", "logoUrl", "mensagemBoasVindas", "nomeCliente", "nomeEstabelecimento", "nomeEvento", "observacoes", "qrCodeData", "slug", "telefoneContato", "totalArrecadado", "totalPedidos", "videoDescansoUrl") SELECT "ativo", "atualizadoEm", "backgroundImageUrl", "configuracoes", "corTema", "criadoEm", "dataFim", "dataInicio", "emailContato", "id", "logoUrl", "mensagemBoasVindas", "nomeCliente", "nomeEstabelecimento", "nomeEvento", "observacoes", "qrCodeData", "slug", "telefoneContato", "totalArrecadado", "totalPedidos", "videoDescansoUrl" FROM "locacoes";
DROP TABLE "locacoes";
ALTER TABLE "new_locacoes" RENAME TO "locacoes";
CREATE UNIQUE INDEX "locacoes_slug_key" ON "locacoes"("slug");
CREATE UNIQUE INDEX "locacoes_slugPainelTV_key" ON "locacoes"("slugPainelTV");
CREATE INDEX "locacoes_slug_idx" ON "locacoes"("slug");
CREATE INDEX "locacoes_ativo_idx" ON "locacoes"("ativo");
CREATE INDEX "locacoes_dataInicio_dataFim_idx" ON "locacoes"("dataInicio", "dataFim");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
