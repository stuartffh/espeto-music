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

-- CreateIndex
CREATE INDEX "sugestoes_categoria_ativo_idx" ON "sugestoes"("categoria", "ativo");

-- CreateIndex
CREATE INDEX "sugestoes_tipo_idx" ON "sugestoes"("tipo");

-- CreateIndex
CREATE INDEX "historico_buscas_termo_idx" ON "historico_buscas"("termo");

-- CreateIndex
CREATE INDEX "historico_buscas_vezesBuscado_idx" ON "historico_buscas"("vezesBuscado");
