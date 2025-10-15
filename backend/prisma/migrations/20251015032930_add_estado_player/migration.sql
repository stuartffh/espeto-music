-- CreateTable
CREATE TABLE "estado_player" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "musicaAtualId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "tempoAtual" REAL NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 80,
    "ultimaAtualizacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
