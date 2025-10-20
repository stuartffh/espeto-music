/**
 * Schemas de Validação com Zod
 *
 * Define todos os schemas de validação da aplicação
 */

const { z } = require('zod');

// ========== SCHEMAS DE MÚSICA ==========

const buscarMusicasSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Termo de busca é obrigatório').max(200, 'Termo muito longo'),
    maxResults: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10))
      .pipe(z.number().int().min(1).max(50)),
  }),
});

const criarPedidoSchema = z.object({
  body: z.object({
    musicaTitulo: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
    musicaYoutubeId: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{11}$/, 'ID do YouTube inválido'),
    musicaThumbnail: z.string().url('URL de thumbnail inválida').optional(),
    musicaDuracao: z.number().int().positive('Duração inválida').optional(),
    nomeCliente: z.string().min(1, 'Nome do cliente é obrigatório').max(100, 'Nome muito longo').optional(),
    dedicatoria: z.string().max(500, 'Dedicatória muito longa').optional(),
    dedicatoriaDe: z.string().max(100, 'Nome muito longo').optional(),
    valor: z.number().positive('Valor deve ser positivo'),
  }),
});

const detalhesVideoSchema = z.object({
  params: z.object({
    videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/, 'ID do YouTube inválido').optional(),
  }),
  query: z.object({
    videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/, 'ID do YouTube inválido').optional(),
  }),
}).refine((data) => data.params.videoId || data.query.videoId, {
  message: 'videoId é obrigatório',
});

// ========== SCHEMAS DE AUTENTICAÇÃO ==========

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  }),
});

const alterarSenhaSchema = z.object({
  body: z.object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    senhaNova: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  }),
});

// ========== SCHEMAS DE CONFIGURAÇÃO ==========

const atualizarConfigSchema = z.object({
  body: z.object({
    chave: z.string().min(1, 'Chave é obrigatória'),
    valor: z.string(),
    descricao: z.string().optional(),
  }),
});

// ========== SCHEMAS DE GIFT CARD ==========

const criarGiftCardSchema = z.object({
  body: z.object({
    valor: z.number().nonnegative('Valor não pode ser negativo').optional().default(0),
    quantidadeMusicas: z.number().int().positive('Quantidade deve ser positiva'),
    dataExpiracao: z
      .string()
      .datetime('Data inválida')
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
    observacao: z.string().max(500, 'Observação muito longa').optional(),
  }),
});

const usarGiftCardSchema = z.object({
  body: z.object({
    codigo: z.string().regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Código de gift card inválido'),
    pedidoMusicaId: z.string().uuid('ID do pedido inválido'),
    nomeCliente: z.string().min(1, 'Nome do cliente é obrigatório').max(100),
  }),
});

// ========== SCHEMAS DE CARRINHO ==========

const criarCarrinhoSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, 'Session ID é obrigatório'),
    nomeCliente: z.string().min(1, 'Nome do cliente é obrigatório').max(100).optional(),
    musicas: z
      .array(
        z.object({
          musicaTitulo: z.string().min(1).max(200),
          musicaYoutubeId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
          musicaThumbnail: z.string().url().optional(),
          musicaDuracao: z.number().int().positive().optional(),
        })
      )
      .min(1, 'Carrinho deve ter pelo menos uma música')
      .max(10, 'Carrinho pode ter no máximo 10 músicas'),
    valorTotal: z.number().positive('Valor total deve ser positivo'),
    quantidadeItens: z.number().int().positive(),
  }),
});

module.exports = {
  // Música
  buscarMusicasSchema,
  criarPedidoSchema,
  detalhesVideoSchema,

  // Auth
  loginSchema,
  alterarSenhaSchema,

  // Config
  atualizarConfigSchema,

  // Gift Card
  criarGiftCardSchema,
  usarGiftCardSchema,

  // Carrinho
  criarCarrinhoSchema,
};
