# 🔐 Credenciais de Acesso - Sistema Multi-Tenant SaaS

## ✅ Banco de Dados Multi-Tenant Configurado

O banco de dados foi resetado e populado com a estrutura multi-tenant completa.

---

## 🔑 Credenciais de Acesso

### Super Admin (Gerencia TODOS os estabelecimentos)
- **URL:** `http://localhost:5173/super-admin`
- **Username:** `superadmin`
- **Senha:** `superadmin123`
- **Função:** Criar estabelecimentos, gerenciar planos, visualizar estatísticas globais

---

### Estabelecimento: Espeto Music Demo
- **Nome:** Espeto Music Demo
- **Slug:** `demo`
- **Código:** `DEMO001`
- **Plano:** Pro (5 TVs, 5000 músicas/mês)

#### Admin do Estabelecimento
- **URL:** `http://localhost:5173/demo/admin`
- **Username:** `admin`
- **Senha:** `admin123`
- **Função:** Gerenciar configurações, player, moderação, gift cards do estabelecimento

#### Cliente (Pedido de Músicas)
- **URL principal:** `http://localhost:5173/demo`
- **URL alternativa:** `http://localhost:5173/DEMO001` (usando código)
- **Função:** Clientes escaneiam QR code e acessam esta tela para pedir músicas

#### TVs (2 cadastradas)

**TV 1: Salão Principal**
- **Código:** `8E37A51F`
- **URL com slug:** `http://localhost:5173/demo/tv`
- **URL com código:** `http://localhost:5173/tv?codigo=8E37A51F`
- **Função:** Exibe vídeos das músicas pedidas

**TV 2: Área Externa**
- **Código:** `941D8CBE`
- **URL com slug:** `http://localhost:5173/demo/tv`
- **URL com código:** `http://localhost:5173/tv?codigo=941D8CBE`
- **Função:** Exibe vídeos das músicas pedidas

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### SuperAdmin
- Gerencia todo o sistema
- Único no sistema

#### Estabelecimento (Tenant)
- Cada estabelecimento é isolado
- Tem suas próprias configurações, TVs, pedidos, pagamentos

#### Admin
- Um ou mais admins por estabelecimento
- Username único por estabelecimento (pode repetir entre estabelecimentos)

#### TV
- Múltiplas TVs por estabelecimento
- Cada TV tem código único para autenticação

#### Dados Multi-Tenant
Todos isolados por estabelecimento:
- Configuracao (36 criadas)
- PedidoMusica
- Pagamento
- GiftCard
- PalavraProibida (4 criadas)
- Sugestao
- HistoricoBusca
- EstadoPlayer (1 por estabelecimento)
- Tema (1 por estabelecimento)
- Carrinho

---

## 🎯 Fluxo de Uso

### Para Criar Novo Estabelecimento:
1. Acesse `/super-admin` com credenciais de super admin
2. Vá em "Estabelecimentos"
3. Clique em "Novo Estabelecimento"
4. Preencha dados (nome, slug, código, plano)
5. Sistema cria automaticamente:
   - Admin do estabelecimento
   - Configurações padrão
   - Estado do player
   - Tema padrão

### Para Acessar um Estabelecimento:
- **Cliente:** `/{slug}` ou `/{codigo}`
- **Admin:** `/{slug}/admin`
- **TV:** `/{slug}/tv` ou `/tv?codigo={TV_CODE}`

### Autenticação Multi-Tenant:
- **Frontend:** Detecta slug/código da URL via TenantContext
- **API:** Middleware detecta tenant via URL ou header
- **WebSocket:** Autenticação via eventos `tv-authenticate` ou `admin-authenticate`

---

## 🔍 Indicadores Visuais de Tenant

### TV Panel
- Badge roxo animado mostrando slug ou código da TV
- Localização: Próximo ao indicador Online/Offline
- Exemplo: `/demo` ou `TV: 8E37A51F`

### Cliente (Home)
- Badge roxo animado no header mostrando slug
- Localização: Canto superior esquerdo
- Exemplo: `/demo`
- Oculto em telas pequenas para economizar espaço

### Admin Dashboard
- Usa `useTenant()` hook para detectar tenant
- Configura API e WebSocket automaticamente
- Todas as queries filtram por estabelecimentoId

---

## ⚙️ Configurações Incluídas (36)

Todas criadas para o estabelecimento demo:
- Preços e pagamento (PRECO_MUSICA, Mercado Pago)
- Modo de operação (modo_gratuito, MODO_FILA)
- Limites (MAX_MUSICAS_FILA, TEMPO_MAXIMO_MUSICA)
- Moderação (MODERACAO_ATIVA, NIVEL_MODERACAO)
- Visual (LOGO_URL, BACKGROUND_IMAGE_URL, COR_TEMA)
- Estabelecimento (NOME_ESTABELECIMENTO, SLOGAN_ESTABELECIMENTO)
- Player (VOLUME_PADRAO, VIDEO_DESCANSO_URL)
- YouTube (YOUTUBE_API_KEY, SEARCH_FILTER_KEYWORD)
- E mais...

---

## 🛡️ Palavras de Moderação (4)

Palavras proibidas criadas para o estabelecimento demo:
- imbecil (MEDIA)
- idiota (MEDIA)
- burro (LEVE)
- estupido (MEDIA)

---

## 🚀 Próximos Passos

1. **Testar acesso de cada URL** com as credenciais fornecidas
2. **Criar segundo estabelecimento** via Super Admin Dashboard
3. **Verificar isolamento** acessando múltiplos estabelecimentos
4. **Testar WebSocket** verificando que TVs só recebem eventos do seu estabelecimento
5. **Configurar Mercado Pago** no painel Admin para aceitar pagamentos

---

## 📝 Observações Importantes

- **Isolamento total:** Cada estabelecimento só vê seus próprios dados
- **WebSocket rooms:** `estabelecimento:{id}` garante isolamento de eventos
- **Middleware:** Backend detecta tenant automaticamente
- **Frontend:** TenantContext gerencia tenant globalmente
- **Sem cookies:** Sistema multi-tenant baseado em URL, não em sessões

---

**Última atualização:** 2025-10-17
**Versão:** 1.0.0 - Multi-Tenant SaaS
**Total de commits:** 29
