# Forçar Rebuild do Docker em Produção

## Problema
O painel admin não tem layout porque o Docker está usando uma build antiga (com o frontend errado).

## Solução: Forçar Rebuild Sem Cache

### No Easypanel:

1. Acesse o painel Easypanel
2. Vá no projeto "espeto-music"
3. Clique em **"Rebuild"** ou **"Redeploy"**
4. **IMPORTANTE**: Marque a opção **"Rebuild without cache"** ou **"No cache"**
5. Aguarde o rebuild completar (pode levar 5-10 minutos)

### Via Linha de Comando (se tiver acesso SSH):

```bash
# Parar containers
docker-compose down

# Rebuild SEM CACHE (importante!)
docker-compose build --no-cache

# Reiniciar
docker-compose up -d
```

## Por que isso é necessário?

O Dockerfile foi corrigido no commit `a566ff9` para usar o frontend completo (`frontend/`) ao invés do frontend demo (`frontend-cliente/`). Porém, o Docker pode ter cache das layers antigas, então precisa fazer rebuild sem cache.

## Como verificar se funcionou?

Depois do rebuild:

1. Acesse https://espeto.zapchatbr.com/admin/login
2. Faça login (admin / admin123)
3. O painel admin deve aparecer com o layout completo:
   - Header roxo com gradiente
   - Tabs de navegação
   - Cards brancos com bordas arredondadas
   - Botões estilizados

Se ainda aparecer sem layout, limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R).

## Commits importantes:

- `a566ff9` - CORREÇÃO CRÍTICA: Usar frontend/ completo ao invés de frontend-cliente/
- `01fc6ea` - Fix WebSocket: adicionar VITE_WEBSOCKET_URL ao .env.production
- `54d443f` - Add: guia para resetar usuário admin em produção
