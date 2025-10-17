# 🛒 Checkout Simplificado - PIX

## 📋 Visão Geral

O sistema possui um **checkout ultra-simplificado** que gera QR Code PIX e Pix Copia e Cola **diretamente no site**, sem redirecionar para o Mercado Pago.

---

## 🚀 Endpoint de Checkout

### **POST /api/pagamentos/pix**

Cria um pagamento PIX e retorna QR Code + Pix Copia e Cola.

---

## 📝 Requisição

### **Dados Necessários (SIMPLIFICADO):**

```json
{
  "pedidoId": "uuid-do-pedido",
  "email": "cliente@email.com",
  "nome": "Nome do Cliente"
}
```

### **Campos:**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `pedidoId` | ✅ SIM | ID do pedido de música |
| `email` | ❌ NÃO | Email do cliente (opcional, usado para notificações) |
| `nome` | ❌ NÃO | Nome do cliente (opcional, apenas para referência) |

**IMPORTANTE:** Apenas `pedidoId` é obrigatório!

---

## 📤 Resposta de Sucesso

```json
{
  "success": true,
  "mensagem": "Pagamento PIX criado com sucesso",
  "pagamento": {
    "id": "abc-123",
    "valor": 5.00,
    "status": "pending",
    "mercadoPagoPaymentId": "1234567890"
  },
  "pix": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "qrCodeText": "00020126580014br.gov.bcb.pix...",
    "expirationDate": "2025-10-31T12:00:00.000Z"
  }
}
```

### **Campos da Resposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pagamento.id` | string | ID do pagamento no banco |
| `pagamento.valor` | number | Valor em R$ |
| `pagamento.status` | string | Status: `pending` |
| `pagamento.mercadoPagoPaymentId` | string | ID no Mercado Pago |
| `pix.qrCode` | string | Imagem do QR Code em Base64 |
| `pix.qrCodeText` | string | Código PIX Copia e Cola |
| `pix.expirationDate` | string | Data de expiração (15 dias) |

---

## 🖼️ Como Usar no Frontend

### **1. Exibir QR Code:**

```html
<img src="{{ qrCode }}" alt="QR Code PIX" />
```

### **2. Exibir Pix Copia e Cola:**

```html
<input type="text" value="{{ qrCodeText }}" readonly />
<button onclick="copiar()">Copiar</button>
```

### **3. Monitorar Pagamento via WebSocket:**

```javascript
const socket = io('https://espeto.zapchatbr.com');

socket.on('pedido:pago', (data) => {
  if (data.pedidoId === meuPedidoId) {
    alert('Pagamento confirmado!');
    // Redirecionar ou atualizar UI
  }
});
```

---

## 🔔 Fluxo Completo

1. **Cliente escolhe música**
   - Frontend cria pedido: `POST /api/musicas`
   - Recebe `pedidoId`

2. **Gera pagamento PIX**
   - Frontend chama: `POST /api/pagamentos/pix`
   - Envia apenas `pedidoId` (email e nome opcionais)
   - Recebe QR Code + Pix Copia e Cola

3. **Cliente paga via PIX**
   - Escaneia QR Code ou copia código
   - Paga no app do banco

4. **Webhook processa pagamento**
   - Mercado Pago envia notificação
   - Sistema atualiza status automaticamente
   - WebSocket notifica frontend em tempo real

5. **Música entra na fila**
   - Status atualizado para `pago`
   - Música adicionada à fila de reprodução
   - Se não houver música tocando, inicia automaticamente

---

## 🧪 Exemplo de Requisição (cURL)

```bash
curl -X POST https://espeto.zapchatbr.com/api/pagamentos/pix \
  -H "Content-Type: application/json" \
  -d '{
    "pedidoId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "cliente@email.com",
    "nome": "João Silva"
  }'
```

---

## 🧪 Exemplo de Requisição (JavaScript)

```javascript
async function criarPagamentoPix(pedidoId, email, nome) {
  try {
    const response = await fetch('https://espeto.zapchatbr.com/api/pagamentos/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pedidoId,
        email: email || undefined, // opcional
        nome: nome || undefined,   // opcional
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Exibir QR Code
      document.getElementById('qrcode').src = data.pix.qrCode;

      // Exibir Pix Copia e Cola
      document.getElementById('pixCode').value = data.pix.qrCodeText;

      // Aguardar confirmação via WebSocket
      socket.on('pedido:pago', (event) => {
        if (event.pedidoId === pedidoId) {
          alert('Pagamento confirmado!');
        }
      });
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

---

## 📊 Logs do Sistema

Quando você chama o endpoint, verá logs detalhados:

### **Criação do Pagamento:**

```
💳 ═══════════════════════════════════════════════════════
   CRIANDO PAGAMENTO PIX
   ═══════════════════════════════════════════════════════
📅 Timestamp: 2025-10-16T15:30:00.000Z
📋 Body recebido: {
  "pedidoId": "abc-123",
  "email": "cliente@email.com",
  "nome": "João"
}

🔍 Pedido ID: abc-123
📧 Email: cliente@email.com
👤 Nome: João

⏳ Gerando QR Code PIX...

✅ [PAGAMENTO] Pagamento PIX criado com sucesso!
💰 Valor: 5
🔢 Payment ID: 1234567890
📱 QR Code: Gerado
📋 Pix Copia e Cola: Gerado
⏰ Expira em: 2025-10-31T12:00:00.000Z
═══════════════════════════════════════════════════════
```

### **Recebimento do Webhook:**

```
🔔 ═══════════════════════════════════════════════════════
   WEBHOOK MERCADO PAGO RECEBIDO
   ═══════════════════════════════════════════════════════
📅 Timestamp: 2025-10-16T15:35:00.000Z

📨 Headers: {...}
📦 Body: {
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}

💳 [WEBHOOK SERVICE] ═════════════════════════════════════
   INFORMAÇÕES DO PAGAMENTO
   ═════════════════════════════════════════════════════
💰 ID: 1234567890
📊 Status: approved
💵 Valor: 5.00
💳 Método: pix
📧 Email Pagador: cliente@email.com
═════════════════════════════════════════════════════

💚 [WEBHOOK SERVICE] ═════════════════════════════════════
   PAGAMENTO APROVADO!
   ═════════════════════════════════════════════════════
📋 Pedido ID: abc-123
💰 Valor: 5.00
🎵 Atualizando status para "pago"...
✅ [WEBHOOK SERVICE] Pedido atualizado com sucesso!
═════════════════════════════════════════════════════

✅ ═══════════════════════════════════════════════════════
   WEBHOOK PROCESSADO COM SUCESSO
   ═══════════════════════════════════════════════════════
📋 Pedido ID: abc-123
🎵 Música: Nome da Música
📊 Status: pago
💰 Pagamento Status: approved
═══════════════════════════════════════════════════════
```

---

## 🚨 Erros Possíveis

### ❌ Pedido não encontrado

```json
{
  "success": false,
  "error": "Pedido não encontrado"
}
```

### ❌ Pedido já processado

```json
{
  "success": false,
  "error": "Este pedido já foi processado"
}
```

### ❌ Token do Mercado Pago não configurado

```json
{
  "success": false,
  "error": "Token do Mercado Pago não configurado. Configure em: Painel Admin > Configurações > MERCADOPAGO_ACCESS_TOKEN"
}
```

---

## ✅ Checklist de Implementação

- [ ] Criar pedido de música (`POST /api/musicas`)
- [ ] Chamar endpoint de pagamento (`POST /api/pagamentos/pix`)
- [ ] Exibir QR Code na tela
- [ ] Exibir Pix Copia e Cola com botão de copiar
- [ ] Conectar ao WebSocket para receber notificações
- [ ] Ouvir evento `pedido:pago`
- [ ] Atualizar UI quando pagamento confirmado
- [ ] Tratar erros e exibir mensagens amigáveis

---

## 🎯 Resumo

**Endpoint:** `POST /api/pagamentos/pix`

**Dados Mínimos:**
```json
{
  "pedidoId": "uuid-do-pedido"
}
```

**Retorno:**
- ✅ QR Code em Base64 (pronto para exibir)
- ✅ Pix Copia e Cola (pronto para copiar)
- ✅ Status do pagamento
- ✅ Data de expiração

**Webhook:** Automático via Mercado Pago

**Notificação:** WebSocket em tempo real

**Sem redirecionamento!** Todo o fluxo acontece no seu site! 🚀

---

**Desenvolvido com ❤️ para o Espeto Music**
