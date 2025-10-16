# 🔔 Configuração de Webhook - Mercado Pago

## 📍 URL do Webhook

A rota do webhook do Mercado Pago no seu sistema é:

```
https://espeto.zapchatbr.com/api/webhooks/mercadopago
```

---

## 🔧 Como Funciona

### 1. **Quando é Acionado**

O webhook é chamado automaticamente pelo Mercado Pago quando:
- ✅ Pagamento PIX é criado
- ✅ Pagamento é aprovado
- ✅ Pagamento é rejeitado
- ✅ Pagamento é cancelado
- ✅ Pagamento é reembolsado

### 2. **O Que o Sistema Faz**

Quando recebe a notificação:
1. Busca informações do pagamento no Mercado Pago
2. Atualiza status do pagamento no banco
3. Atualiza status do pedido de música
4. Emite evento WebSocket para atualizar frontend
5. Inicia reprodução se for o primeiro da fila

---

## ⚙️ Configuração no Servidor

### **1. Configurar BASE_URL no .env**

Edite seu arquivo `.env` no servidor:

```bash
# ========================================
# URL BASE (OBRIGATÓRIO)
# ========================================
# URL base para webhooks e QR Codes
# IMPORTANTE: Use HTTPS em produção!
BASE_URL=https://espeto.zapchatbr.com
```

### **2. Configurar NODE_ENV**

```bash
NODE_ENV=production
```

### **3. Reiniciar Servidor**

```bash
pm2 restart espeto-music
# ou
systemctl restart espeto-music
```

---

## 🌐 Configuração no Mercado Pago

### **Opção 1: Automático (Recomendado)**

O webhook é configurado automaticamente em cada pagamento criado através do campo `notification_url`.

✅ **Não precisa fazer nada no painel do Mercado Pago!**

### **Opção 2: Global (Opcional)**

Se quiser configurar globalmente:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Clique em **"Webhooks"** no menu lateral
4. Adicione a URL: `https://espeto.zapchatbr.com/api/webhooks/mercadopago`
5. Selecione eventos:
   - ✅ Pagamentos
   - ✅ Chargebacks
   - ✅ Devoluções

---

## 🧪 Testar Webhook

### **1. Criar Pagamento de Teste**

```bash
curl -X POST https://espeto.zapchatbr.com/api/pagamentos/pix \
  -H "Content-Type: application/json" \
  -d '{
    "pedidoId": "test-123",
    "email": "test@example.com"
  }'
```

### **2. Verificar Logs**

```bash
# Ver logs do servidor
pm2 logs espeto-music

# Ou se usar systemd
journalctl -u espeto-music -f
```

### **3. Simular Webhook Manualmente**

```bash
curl -X POST https://espeto.zapchatbr.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "PAYMENT_ID_AQUI"
    }
  }'
```

---

## 🔍 Verificar se Webhook Está Funcionando

### **1. Logs do Sistema**

Quando o webhook é acionado, você verá:

```
📩 Webhook recebido do Mercado Pago
Headers: {...}
Body: { type: 'payment', data: { id: '123456789' } }
💳 Informações do pagamento: {...}
✅ Pagamento aprovado! Pedido atualizado: abc-123
```

### **2. Painel Admin**

Acesse: https://espeto.zapchatbr.com/admin
- Veja o status dos pagamentos atualizando em tempo real
- Verifique se pedidos passam de "pendente" para "pago"

### **3. Banco de Dados**

```bash
cd backend
sqlite3 dev.db "SELECT * FROM pagamentos ORDER BY criadoEm DESC LIMIT 5;"
```

---

## 🚨 Solução de Problemas

### ❌ Webhook não está sendo chamado

**Causas Possíveis:**

1. **BASE_URL incorreta no .env**
   ```bash
   # Deve ser HTTPS em produção
   BASE_URL=https://espeto.zapchatbr.com  # ✅ Correto
   BASE_URL=http://espeto.zapchatbr.com   # ❌ Errado
   ```

2. **Firewall bloqueando**
   - Libere porta 3000 (ou sua porta configurada)
   - IPs do Mercado Pago devem ter acesso

3. **SSL/HTTPS não configurado**
   - Mercado Pago EXIGE HTTPS em produção
   - Configure certificado SSL (Let's Encrypt recomendado)

### ❌ Webhook retorna erro 500

**Verificar:**

1. **Token do Mercado Pago configurado**
   - Acesse: https://espeto.zapchatbr.com/admin
   - Configure `MERCADOPAGO_ACCESS_TOKEN`

2. **Logs de erro**
   ```bash
   pm2 logs espeto-music --err
   ```

3. **Banco de dados acessível**
   ```bash
   cd backend
   sqlite3 dev.db ".tables"
   ```

### ❌ Pagamento não atualiza status

**Verificar:**

1. **WebSocket funcionando**
   - Abra console do navegador
   - Deve ver mensagem: "WebSocket conectado"

2. **Pedido existe no banco**
   ```bash
   sqlite3 dev.db "SELECT * FROM pedidos_musica WHERE id='PEDIDO_ID';"
   ```

3. **External reference correto**
   - O campo `external_reference` do pagamento deve corresponder ao ID do pedido

---

## 📊 Estrutura do Webhook

### **Request do Mercado Pago:**

```json
{
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

### **Response do Sistema:**

```
HTTP/1.1 200 OK
Content-Type: text/plain

OK
```

---

## 🔐 Segurança

### **Validações Implementadas:**

✅ Verifica tipo de notificação (`type === 'payment'`)
✅ Busca pagamento diretamente da API do Mercado Pago (não confia no webhook)
✅ Valida se pedido existe no banco antes de atualizar
✅ Registra todos os webhooks recebidos

### **Recomendações:**

- ✅ Use HTTPS em produção (obrigatório)
- ✅ Configure rate limiting no nginx/apache
- ✅ Monitore logs de webhook
- ✅ Configure alertas para erros

---

## 🎯 Checklist de Configuração

Antes de colocar em produção, verifique:

- [ ] `BASE_URL` configurada com HTTPS
- [ ] `NODE_ENV=production`
- [ ] Tokens do Mercado Pago de PRODUÇÃO configurados
- [ ] SSL/HTTPS configurado no servidor
- [ ] Firewall liberando acesso do Mercado Pago
- [ ] Webhook testado e funcionando
- [ ] Logs sendo monitorados
- [ ] Sistema reiniciado após mudanças

---

## 📚 Referências

- **Documentação Mercado Pago:** https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- **IPs do Mercado Pago:** https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/ipn/additional-info

---

## 💡 URL Completa

Para seu domínio `espeto.zapchatbr.com`, a URL completa do webhook é:

```
https://espeto.zapchatbr.com/api/webhooks/mercadopago
```

Configure esta URL no arquivo `.env` como:

```bash
BASE_URL=https://espeto.zapchatbr.com
```

O sistema automaticamente concatenará `/api/webhooks/mercadopago` à BASE_URL! 🚀

**Desenvolvido com ❤️ para o Espeto Music**
