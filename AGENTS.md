## Lista de Agentes

### Prisma ORM Client
- **Função principal:** manter e aplicar o schema relacional do Espeto Music.
- **Stack/Tecnologias:** Node.js, Prisma ORM 5.x, SQLite.
- **Integrações:** controla migrações em `backend/prisma/migrations`, gera o cliente em `backend/node_modules/@prisma/client` e interage com o banco `DATABASE_URL`.
- **Permissões/Autorização:** requer acesso de escrita ao diretório `backend/prisma` e ao arquivo SQLite informado pela variável de ambiente `DATABASE_URL`.
- **Exemplo de uso:** `DATABASE_URL="file:./prisma/dev.db" npx prisma migrate reset --force --skip-generate`.

## Funções e Comportamentos

### Prisma ORM Client
- Ao criar ou atualizar tabelas, garantir que os IDs string tenham `@default(uuid())` para corresponder às chamadas do código.
- Campos `atualizadoEm` devem possuir `@default(now()) @updatedAt` e colunas SQLite com `DEFAULT CURRENT_TIMESTAMP` para permitir inserts sem preencher manualmente.
- Após alterar `schema.prisma` ou migrações, executar `npx prisma generate` antes de rodar seeds ou subir o servidor.
- Mantenha as migrações ordenadas cronologicamente; o diretório `20241217000000_init` deve ser aplicado antes das demais.
- Seeds padrão: `npm run seed:all` (usa `seed-config.js` e `seed-moderation.js`).
