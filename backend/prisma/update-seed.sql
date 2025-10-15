-- Adicionar configuração de modo gratuito
INSERT INTO configuracoes (id, chave, valor, descricao, tipo, criadoEm, atualizadoEm)
VALUES (
  lower(hex(randomblob(16))),
  'MODO_GRATUITO',
  'true',
  'Sistema gratuito (sem pagamento) ou pago',
  'boolean',
  datetime('now'),
  datetime('now')
);
