# Como Resetar o Usuário Admin em Produção

Se você está tendo problemas para fazer login no painel admin (`401 Unauthorized`), siga estes passos:

## Opção 1: Via Docker (Produção)

Execute o script de criação do admin dentro do container Docker:

```bash
docker-compose exec espeto-music node create-admin-production.js
```

Isso vai criar/resetar o usuário admin com as credenciais padrão:
- **Username:** `admin`
- **Password:** `admin123`

## Opção 2: Via SSH no Servidor

Se você tem acesso SSH ao servidor de produção:

```bash
# 1. Entre no container
docker exec -it espeto-music sh

# 2. Execute o script
node create-admin-production.js

# 3. Saia do container
exit
```

## Opção 3: Manualmente via Prisma Studio

```bash
# Entre no container
docker exec -it espeto-music sh

# Execute o Prisma Studio
npx prisma studio

# Acesse http://localhost:5555 e edite/crie o usuário admin manualmente
```

## Verificar se o Admin Existe

```bash
docker exec -it espeto-music npx prisma studio
```

Depois acesse a tabela `Admin` e verifique se o usuário `admin` existe.

## Credenciais Padrão

Após resetar, use estas credenciais para fazer login:

```
Username: admin
Password: admin123
```

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## Troubleshooting

### Erro: "docker-compose command not found"
Use `docker compose` (sem hífen) ao invés de `docker-compose`.

### Erro: "container not found"
Verifique o nome do container:
```bash
docker ps
```

O nome pode ser `espeto-music` ou `espeto_music`, dependendo da configuração.
