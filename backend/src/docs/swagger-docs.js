/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica saúde do servidor
 *     description: Retorna status de saúde do servidor, banco de dados e uso de memória
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded]
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Tempo de atividade em segundos
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: boolean
 *                     downloads:
 *                       type: boolean
 *                     memory:
 *                       type: boolean
 *                 memory:
 *                   type: object
 *                   properties:
 *                     heapUsed:
 *                       type: string
 *                     heapTotal:
 *                       type: string
 *                     rss:
 *                       type: string
 */

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Métricas Prometheus
 *     description: Retorna métricas no formato Prometheus para monitoramento
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Métricas em formato texto Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Lista todos os pedidos
 *     description: Retorna lista de pedidos com filtros opcionais
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: statusPagamento
 *         schema:
 *           type: string
 *           enum: [pendente, pago, cancelado]
 *         description: Filtrar por status de pagamento
 *       - in: query
 *         name: statusMusica
 *         schema:
 *           type: string
 *           enum: [pendente, na_fila, tocando, tocada, cancelada]
 *         description: Filtrar por status da música
 *       - in: query
 *         name: nomeCliente
 *         schema:
 *           type: string
 *         description: Buscar por nome do cliente
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *   post:
 *     summary: Cria novo pedido
 *     description: Cria um novo pedido de música (pagamento pendente)
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - musicaTitulo
 *               - musicaYoutubeId
 *               - valor
 *             properties:
 *               musicaTitulo:
 *                 type: string
 *                 example: "Bohemian Rhapsody"
 *               musicaYoutubeId:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9_-]{11}$'
 *                 example: "fJ9rUzIMcZQ"
 *               musicaThumbnail:
 *                 type: string
 *                 format: uri
 *               musicaDuracao:
 *                 type: integer
 *                 example: 354
 *               nomeCliente:
 *                 type: string
 *                 example: "João Silva"
 *               dedicatoria:
 *                 type: string
 *                 example: "Para minha namorada"
 *               dedicatoriaDe:
 *                 type: string
 *                 example: "João"
 *               valor:
 *                 type: number
 *                 format: float
 *                 example: 5.00
 *               giftCardId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Busca pedido por ID
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Cancela pedido
 *     description: Cancela um pedido que ainda não foi tocado
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pedido cancelado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 pedido:
 *                   $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Pedido não pode ser cancelado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/fila:
 *   get:
 *     summary: Retorna estado da fila
 *     description: Retorna fila completa com música atual, próxima e todos os pedidos na fila
 *     tags: [Fila]
 *     responses:
 *       200:
 *         description: Estado da fila
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fila:
 *                   $ref: '#/components/schemas/Fila'
 *                 musicaAtual:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Pedido'
 *                   nullable: true
 *                 proximaMusica:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Pedido'
 *                   nullable: true
 *                 pedidos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pedido'
 *                 totalPedidos:
 *                   type: integer
 */

/**
 * @swagger
 * /api/gift-cards:
 *   get:
 *     summary: Lista gift cards
 *     tags: [Gift Cards]
 *     parameters:
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: expirado
 *         schema:
 *           type: boolean
 *         description: Filtrar por expirados
 *     responses:
 *       200:
 *         description: Lista de gift cards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GiftCard'
 *   post:
 *     summary: Cria novo gift card
 *     description: Cria gift card com código único gerado automaticamente
 *     tags: [Gift Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantidadeMusicas
 *             properties:
 *               quantidadeMusicas:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *                 description: Quantidade de músicas no gift card
 *               valor:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 example: 25.00
 *                 description: Valor total do gift card (opcional)
 *               dataExpiracao:
 *                 type: string
 *                 format: date-time
 *                 description: Data de expiração (opcional)
 *               observacao:
 *                 type: string
 *                 description: Observações sobre o gift card
 *     responses:
 *       201:
 *         description: Gift card criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GiftCard'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /api/gift-cards/{codigo}:
 *   get:
 *     summary: Busca gift card por código
 *     tags: [Gift Cards]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$'
 *         example: "GIFT-ABC1-XYZ9"
 *     responses:
 *       200:
 *         description: Gift card encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GiftCard'
 *       404:
 *         description: Gift card não encontrado
 */

/**
 * @swagger
 * /api/gift-cards/usar:
 *   post:
 *     summary: Usa gift card em um pedido
 *     description: Aplica gift card a um pedido, usa uma música e processa pagamento automaticamente
 *     tags: [Gift Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - pedidoMusicaId
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: "GIFT-ABC1-XYZ9"
 *               pedidoMusicaId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do pedido que receberá o gift card
 *               nomeCliente:
 *                 type: string
 *                 example: "Maria Santos"
 *                 description: Nome do cliente (opcional)
 *     responses:
 *       200:
 *         description: Gift card usado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedido:
 *                   $ref: '#/components/schemas/Pedido'
 *                 giftCard:
 *                   type: object
 *                   properties:
 *                     codigo:
 *                       type: string
 *                     musicasRestantes:
 *                       type: integer
 *                     ativo:
 *                       type: boolean
 *                 posicaoFila:
 *                   type: integer
 *                 mensagem:
 *                   type: string
 *       400:
 *         description: Gift card inválido ou pedido já pago
 *       404:
 *         description: Gift card ou pedido não encontrado
 */

/**
 * @swagger
 * /api/musicas/buscar:
 *   get:
 *     summary: Busca músicas no YouTube
 *     description: Busca músicas no YouTube por termo de pesquisa
 *     tags: [Músicas]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *         example: "queen bohemian rhapsody"
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Resultados da busca
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Musica'
 *       400:
 *         description: Parâmetros inválidos
 */

/**
 * @swagger
 * /api/pagamentos/criar:
 *   post:
 *     summary: Cria pagamento Mercado Pago
 *     description: Gera preferência de pagamento para o Mercado Pago
 *     tags: [Pagamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pedidoMusicaId
 *             properties:
 *               pedidoMusicaId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do pedido a ser pago
 *     responses:
 *       200:
 *         description: Preferência de pagamento criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ID da preferência do Mercado Pago
 *                 init_point:
 *                   type: string
 *                   format: uri
 *                   description: URL para checkout
 *       400:
 *         description: Pedido inválido
 *       404:
 *         description: Pedido não encontrado
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Login de administrador
 *     description: Autentica admin e retorna token JWT
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario
 *               - senha
 *             properties:
 *               usuario:
 *                 type: string
 *                 example: "admin"
 *               senha:
 *                 type: string
 *                 format: password
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     usuario:
 *                       type: string
 *       401:
 *         description: Credenciais inválidas
 */

/**
 * @swagger
 * /api/configuracoes:
 *   get:
 *     summary: Retorna configurações do sistema
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações atuais
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valorPorMusica:
 *                   type: number
 *                   format: float
 *                   example: 5.00
 *                 tempoMaximoMusica:
 *                   type: integer
 *                   description: Tempo máximo em segundos
 *                   example: 600
 *                 moderacaoAtiva:
 *                   type: boolean
 *                   example: true
 */

// Exportar vazio (arquivo apenas para documentação JSDoc)
module.exports = {};
