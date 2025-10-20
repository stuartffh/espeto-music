/**
 * Swagger Configuration
 *
 * Documentação completa da API usando OpenAPI 3.0
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Espeto Music API',
      version: '1.0.0',
      description: `
# 🎵 Espeto Music API

API completa para o sistema Espeto Music - Jukebox Digital para Restaurantes.

## Recursos Principais

- **Pedidos de Música**: Criar e gerenciar pedidos de músicas
- **Fila de Reprodução**: Controlar fila de músicas
- **Gift Cards**: Sistema de gift cards para múltiplas músicas
- **Pagamentos**: Integração com Mercado Pago
- **Busca de Músicas**: Buscar músicas no YouTube
- **WebSocket**: Atualizações em tempo real

## Autenticação

Alguns endpoints requerem autenticação via JWT.
Adicione o token no header: \`Authorization: Bearer {token}\`

## Arquitetura

Esta API segue princípios de Clean Architecture com:
- Domain Layer (Entidades e Value Objects)
- Application Layer (Use Cases)
- Infrastructure Layer (Repositories)
- Interface Layer (Controllers HTTP)

Documentação completa da arquitetura: \`/backend/CLEAN_ARCHITECTURE.md\`

## Monitoramento

- **Health Check**: \`GET /api/health\`
- **Métricas Prometheus**: \`GET /api/metrics\`
- **Logs**: Winston com rotação automática

## Base URL

- **Desenvolvimento**: \`http://localhost:3000/api\`
- **Produção**: Configurável via \`BASE_URL\`
      `,
      contact: {
        name: 'Suporte Espeto Music',
        email: 'suporte@espetomusic.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.espetomusic.com',
        description: 'Servidor de Produção'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de saúde e monitoramento'
      },
      {
        name: 'Pedidos',
        description: 'Gerenciamento de pedidos de música'
      },
      {
        name: 'Fila',
        description: 'Controle da fila de reprodução'
      },
      {
        name: 'Gift Cards',
        description: 'Sistema de gift cards'
      },
      {
        name: 'Músicas',
        description: 'Busca e informações de músicas'
      },
      {
        name: 'Pagamentos',
        description: 'Processamento de pagamentos'
      },
      {
        name: 'Carrinho',
        description: 'Gerenciamento de carrinho de compras'
      },
      {
        name: 'Moderação',
        description: 'Sistema de moderação de conteúdo'
      },
      {
        name: 'Configurações',
        description: 'Configurações do sistema'
      },
      {
        name: 'Admin',
        description: 'Endpoints administrativos (requer autenticação)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            erro: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            detalhes: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Detalhes adicionais do erro (validações, etc.)'
            }
          }
        },
        Pedido: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do pedido'
            },
            musicaTitulo: {
              type: 'string',
              description: 'Título da música',
              example: 'Bohemian Rhapsody'
            },
            musicaYoutubeId: {
              type: 'string',
              pattern: '^[a-zA-Z0-9_-]{11}$',
              description: 'ID do YouTube (11 caracteres)',
              example: 'fJ9rUzIMcZQ'
            },
            musicaThumbnail: {
              type: 'string',
              format: 'uri',
              description: 'URL da thumbnail da música'
            },
            musicaDuracao: {
              type: 'integer',
              description: 'Duração em segundos',
              example: 354
            },
            nomeCliente: {
              type: 'string',
              nullable: true,
              description: 'Nome do cliente que fez o pedido',
              example: 'João Silva'
            },
            dedicatoria: {
              type: 'string',
              nullable: true,
              description: 'Mensagem de dedicatória',
              example: 'Para minha namorada'
            },
            dedicatoriaDe: {
              type: 'string',
              nullable: true,
              description: 'Nome de quem dedicou',
              example: 'João'
            },
            valor: {
              type: 'number',
              format: 'float',
              description: 'Valor do pedido em R$',
              example: 5.00
            },
            statusPagamento: {
              type: 'string',
              enum: ['pendente', 'pago', 'cancelado'],
              description: 'Status do pagamento',
              example: 'pago'
            },
            statusMusica: {
              type: 'string',
              enum: ['pendente', 'na_fila', 'tocando', 'tocada', 'cancelada'],
              description: 'Status da música na fila',
              example: 'na_fila'
            },
            posicaoFila: {
              type: 'integer',
              nullable: true,
              description: 'Posição na fila de reprodução',
              example: 3
            },
            giftCardId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID do gift card usado (se aplicável)'
            },
            criadoEm: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            atualizadoEm: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        GiftCard: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            codigo: {
              type: 'string',
              pattern: '^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$',
              description: 'Código único do gift card',
              example: 'GIFT-ABC1-XYZ9'
            },
            valor: {
              type: 'number',
              format: 'float',
              description: 'Valor do gift card em R$',
              example: 25.00
            },
            quantidadeMusicas: {
              type: 'integer',
              description: 'Quantidade total de músicas',
              example: 5
            },
            quantidadeMusicasUsadas: {
              type: 'integer',
              description: 'Quantidade de músicas já usadas',
              example: 2
            },
            musicasRestantes: {
              type: 'integer',
              description: 'Músicas restantes',
              example: 3
            },
            dataExpiracao: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data de expiração (opcional)'
            },
            ativo: {
              type: 'boolean',
              description: 'Se o gift card está ativo',
              example: true
            },
            expirado: {
              type: 'boolean',
              description: 'Se o gift card está expirado',
              example: false
            },
            podeSerUsado: {
              type: 'boolean',
              description: 'Se pode ser usado no momento',
              example: true
            },
            observacao: {
              type: 'string',
              nullable: true,
              description: 'Observações sobre o gift card'
            },
            criadoEm: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Fila: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            statusAtual: {
              type: 'string',
              enum: ['parada', 'tocando', 'pausada'],
              description: 'Status atual da fila',
              example: 'tocando'
            },
            musicaAtualId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID do pedido que está tocando'
            },
            proximaMusicaId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID do próximo pedido'
            }
          }
        },
        Musica: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID do YouTube',
              example: 'dQw4w9WgXcQ'
            },
            titulo: {
              type: 'string',
              description: 'Título da música',
              example: 'Rick Astley - Never Gonna Give You Up'
            },
            canal: {
              type: 'string',
              description: 'Nome do canal do YouTube',
              example: 'Rick Astley'
            },
            thumbnail: {
              type: 'string',
              format: 'uri',
              description: 'URL da thumbnail'
            },
            duracao: {
              type: 'integer',
              description: 'Duração em segundos',
              example: 213
            },
            duracaoFormatada: {
              type: 'string',
              description: 'Duração formatada (MM:SS)',
              example: '3:33'
            }
          }
        },
        Carrinho: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            sessionId: {
              type: 'string',
              description: 'ID da sessão (baseado em IP)'
            },
            nomeCliente: {
              type: 'string',
              nullable: true,
              example: 'João Silva'
            },
            itens: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  musicaTitulo: {
                    type: 'string'
                  },
                  musicaYoutubeId: {
                    type: 'string'
                  },
                  musicaThumbnail: {
                    type: 'string'
                  },
                  musicaDuracao: {
                    type: 'integer'
                  },
                  valor: {
                    type: 'number',
                    format: 'float'
                  }
                }
              }
            },
            valorTotal: {
              type: 'number',
              format: 'float',
              description: 'Valor total do carrinho'
            },
            quantidadeItens: {
              type: 'integer',
              description: 'Quantidade de músicas no carrinho'
            },
            criadoEm: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Mesa: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            numero: {
              type: 'integer',
              example: 10
            },
            nome: {
              type: 'string',
              nullable: true,
              example: 'Mesa VIP'
            },
            token: {
              type: 'string',
              description: 'Token único para QR Code'
            },
            ativa: {
              type: 'boolean',
              description: 'Se a mesa está ativa'
            },
            criadaEm: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PalavraProibida: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            palavra: {
              type: 'string',
              example: 'palavrao'
            },
            ativa: {
              type: 'boolean',
              description: 'Se a palavra está ativa na moderação'
            },
            criadaEm: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Configuracao: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            chave: {
              type: 'string',
              example: 'valor_por_musica'
            },
            valor: {
              type: 'string',
              description: 'Valor como string (pode ser convertido)'
            },
            tipo: {
              type: 'string',
              enum: ['string', 'number', 'boolean'],
              example: 'number'
            },
            descricao: {
              type: 'string',
              nullable: true
            }
          }
        }
      }
    }
  },
  apis: [
    './src/docs/swagger-docs.js',
    './src/docs/swagger-docs-extended.js',
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/interfaces/http/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
