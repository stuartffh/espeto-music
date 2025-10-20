/**
 * DOCUMENTAÇÃO SWAGGER EXTENDIDA
 *
 * Endpoints adicionais e schemas complementares
 */

/**
 * @swagger
 * /api/player/estado:
 *   get:
 *     summary: Obtém estado do player
 *     description: Retorna estado completo do player (música atual, fila, status)
 *     tags: [Player]
 *     responses:
 *       200:
 *         description: Estado do player
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusPlayer:
 *                   type: string
 *                   enum: [parado, tocando, pausado]
 *                   example: tocando
 *                 musicaAtual:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Pedido'
 *                   nullable: true
 *                 fila:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pedido'
 *                 tempoDecorrido:
 *                   type: number
 *                   description: Tempo decorrido em segundos
 *                 volume:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 */

/**
 * @swagger
 * /api/player/play:
 *   post:
 *     summary: Inicia reprodução
 *     description: Inicia ou resume o player
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Player iniciado
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /api/player/pause:
 *   post:
 *     summary: Pausa reprodução
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Player pausado
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /api/player/stop:
 *   post:
 *     summary: Para reprodução
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Player parado
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /api/player/skip:
 *   post:
 *     summary: Pula música atual
 *     description: Pula para a próxima música da fila
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Música pulada
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /api/player/volume:
 *   post:
 *     summary: Ajusta volume
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - volume
 *             properties:
 *               volume:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *     responses:
 *       200:
 *         description: Volume ajustado
 *       400:
 *         description: Volume inválido
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /api/player/reset:
 *   post:
 *     summary: Reseta player
 *     description: Reseta completamente o estado do player (debug)
 *     tags: [Player]
 *     responses:
 *       200:
 *         description: Player resetado
 */

/**
 * @swagger
 * /api/carrinho:
 *   get:
 *     summary: Lista carrinho atual
 *     description: Retorna itens do carrinho identificado por sessionId (IP)
 *     tags: [Carrinho]
 *     responses:
 *       200:
 *         description: Carrinho atual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 sessionId:
 *                   type: string
 *                 nomeCliente:
 *                   type: string
 *                   nullable: true
 *                 itens:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       musicaTitulo:
 *                         type: string
 *                       musicaYoutubeId:
 *                         type: string
 *                       musicaThumbnail:
 *                         type: string
 *                       musicaDuracao:
 *                         type: integer
 *                       valor:
 *                         type: number
 *                 valorTotal:
 *                   type: number
 *                 quantidadeItens:
 *                   type: integer
 *   post:
 *     summary: Adiciona música ao carrinho
 *     tags: [Carrinho]
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
 *               musicaYoutubeId:
 *                 type: string
 *               musicaThumbnail:
 *                 type: string
 *               musicaDuracao:
 *                 type: integer
 *               valor:
 *                 type: number
 *     responses:
 *       200:
 *         description: Música adicionada
 *       400:
 *         description: Dados inválidos
 *   delete:
 *     summary: Limpa todo o carrinho
 *     tags: [Carrinho]
 *     responses:
 *       200:
 *         description: Carrinho limpo
 */

/**
 * @swagger
 * /api/carrinho/{youtubeId}:
 *   delete:
 *     summary: Remove música do carrinho
 *     tags: [Carrinho]
 *     parameters:
 *       - in: path
 *         name: youtubeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do YouTube da música
 *     responses:
 *       200:
 *         description: Música removida
 *       404:
 *         description: Música não encontrada no carrinho
 */

/**
 * @swagger
 * /api/carrinho/nome:
 *   patch:
 *     summary: Define nome do cliente
 *     tags: [Carrinho]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeCliente
 *             properties:
 *               nomeCliente:
 *                 type: string
 *                 example: João Silva
 *     responses:
 *       200:
 *         description: Nome definido
 */

/**
 * @swagger
 * /api/admin/moderacao/palavras:
 *   get:
 *     summary: Lista palavras proibidas
 *     tags: [Moderação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de palavras
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   palavra:
 *                     type: string
 *                   ativa:
 *                     type: boolean
 *                   criadaEm:
 *                     type: string
 *                     format: date-time
 *   post:
 *     summary: Adiciona palavra proibida
 *     tags: [Moderação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - palavra
 *             properties:
 *               palavra:
 *                 type: string
 *                 example: palavrao
 *     responses:
 *       201:
 *         description: Palavra adicionada
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /api/admin/moderacao/palavras/{id}:
 *   put:
 *     summary: Atualiza palavra proibida
 *     tags: [Moderação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               palavra:
 *                 type: string
 *     responses:
 *       200:
 *         description: Palavra atualizada
 *   delete:
 *     summary: Deleta palavra proibida
 *     tags: [Moderação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Palavra deletada
 */

/**
 * @swagger
 * /api/admin/moderacao/palavras/{id}/toggle:
 *   post:
 *     summary: Ativa/desativa palavra
 *     tags: [Moderação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status alterado
 */

/**
 * @swagger
 * /api/admin/moderacao/testar:
 *   post:
 *     summary: Testa texto contra moderação
 *     description: Verifica se um texto contém palavras proibidas
 *     tags: [Moderação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - texto
 *             properties:
 *               texto:
 *                 type: string
 *                 example: Este é um texto para testar
 *     responses:
 *       200:
 *         description: Resultado do teste
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 aprovado:
 *                   type: boolean
 *                 palavrasEncontradas:
 *                   type: array
 *                   items:
 *                     type: string
 */

/**
 * @swagger
 * /api/admin/moderacao/estatisticas:
 *   get:
 *     summary: Estatísticas de moderação
 *     tags: [Moderação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPalavras:
 *                   type: integer
 *                 palavrasAtivas:
 *                   type: integer
 *                 totalBloqueios:
 *                   type: integer
 */

/**
 * @swagger
 * /api/mesas:
 *   get:
 *     summary: Lista todas as mesas
 *     tags: [Mesas]
 *     responses:
 *       200:
 *         description: Lista de mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   numero:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   token:
 *                     type: string
 *                   ativa:
 *                     type: boolean
 *   post:
 *     summary: Cria nova mesa
 *     tags: [Mesas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *             properties:
 *               numero:
 *                 type: integer
 *                 example: 10
 *               nome:
 *                 type: string
 *                 example: Mesa VIP
 *     responses:
 *       201:
 *         description: Mesa criada
 */

/**
 * @swagger
 * /api/mesas/{id}:
 *   get:
 *     summary: Busca mesa por ID
 *     tags: [Mesas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mesa encontrada
 *       404:
 *         description: Mesa não encontrada
 */

/**
 * @swagger
 * /api/mesas/token/{token}:
 *   get:
 *     summary: Busca mesa por token QR Code
 *     tags: [Mesas]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mesa encontrada
 *       404:
 *         description: Mesa não encontrada
 */

/**
 * @swagger
 * /api/mesas/{id}/qrcode:
 *   get:
 *     summary: Gera QR Code para mesa
 *     description: Retorna imagem QR Code em base64
 *     tags: [Mesas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR Code gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *                   description: Imagem em base64
 *                 url:
 *                   type: string
 *                   description: URL do QR Code
 */

/**
 * @swagger
 * /api/mesas/{id}/status:
 *   patch:
 *     summary: Atualiza status da mesa
 *     tags: [Mesas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ativa:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status atualizado
 */

/**
 * @swagger
 * /api/public/config:
 *   get:
 *     summary: Lista configurações públicas
 *     description: Acesso público para frontend (Cliente/TV)
 *     tags: [Público]
 *     responses:
 *       200:
 *         description: Configurações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   chave:
 *                     type: string
 *                   valor:
 *                     type: string
 *                   tipo:
 *                     type: string
 */

/**
 * @swagger
 * /api/public/config/{chave}:
 *   get:
 *     summary: Busca configuração específica
 *     tags: [Público]
 *     parameters:
 *       - in: path
 *         name: chave
 *         required: true
 *         schema:
 *           type: string
 *         example: valor_por_musica
 *     responses:
 *       200:
 *         description: Configuração encontrada
 *       404:
 *         description: Configuração não encontrada
 */

/**
 * @swagger
 * /api/public/gifts/validar/{codigo}:
 *   get:
 *     summary: Valida gift card
 *     description: Verifica se gift card existe e pode ser usado
 *     tags: [Público]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: GIFT-ABC1-XYZ9
 *     responses:
 *       200:
 *         description: Gift card válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GiftCard'
 *       404:
 *         description: Gift card não encontrado
 */

/**
 * @swagger
 * /api/public/gifts/usar:
 *   post:
 *     summary: Usa gift card (público)
 *     description: Endpoint público para usar gift card em um pedido
 *     tags: [Público]
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
 *               pedidoMusicaId:
 *                 type: string
 *               nomeCliente:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gift card usado
 */

/**
 * @swagger
 * /api/public/gifts/usar-carrinho:
 *   post:
 *     summary: Usa gift card em carrinho
 *     description: Aplica gift card a múltiplas músicas do carrinho
 *     tags: [Público]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - carrinhoId
 *             properties:
 *               codigo:
 *                 type: string
 *               carrinhoId:
 *                 type: string
 *               nomeCliente:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gift card aplicado ao carrinho
 *       400:
 *         description: Gift card sem músicas suficientes
 */

// Exportar vazio (arquivo apenas para documentação JSDoc)
module.exports = {};
