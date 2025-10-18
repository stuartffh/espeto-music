-- AlterTable - Adicionar campo prioridade se não existir
ALTER TABLE pedidos_musica ADD COLUMN prioridade BOOLEAN DEFAULT false;