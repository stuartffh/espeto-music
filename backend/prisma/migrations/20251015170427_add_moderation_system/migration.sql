-- AlterTable
ALTER TABLE "pedidos_musica" ADD COLUMN "moderadoPor" TEXT;
ALTER TABLE "pedidos_musica" ADD COLUMN "motivoRejeicao" TEXT;

-- CreateTable
CREATE TABLE "palavras_proibidas" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "palavra" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'AMBOS',
    "severidade" TEXT NOT NULL DEFAULT 'MEDIA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "palavras_proibidas_categoria_idx" ON "palavras_proibidas"("categoria");

-- CreateIndex
CREATE INDEX "palavras_proibidas_severidade_idx" ON "palavras_proibidas"("severidade");

-- CreateIndex
CREATE INDEX "palavras_proibidas_ativo_idx" ON "palavras_proibidas"("ativo");
