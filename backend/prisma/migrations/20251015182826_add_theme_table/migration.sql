-- CreateTable
CREATE TABLE "temas" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'active',
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
    "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
