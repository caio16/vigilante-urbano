# Vigilante Urbano

Um aplicativo de mapa comunitário para relatar pontos de interesse e conversar por bairro.

## Configuração

As variáveis de ambiente Supabase já estão configuradas em `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Desenvolvendo

```bash
pnpm dev
```

Acesse [http://localhost:3001](http://localhost:3001)

## Recursos

- 📍 Adicione pontos de interesse no mapa
- 💬 Chat por comunidade
- ⏰ Mensagens expiram automaticamente em 10 minutos
- 📌 Fixe mensagens importantes (senha: `admin123`)
- 🗑️ Moderadores podem deletar mensagens (senha: `mod123`)
- 👤 Cadastro e login de usuários (`/cadastro` e `/login`)
- 🛡️ Painel de administração (`/admin`): promover/remover administradores e banir/desbanir usuários
- 🗄️ Funciona 100% offline (dados salvos no navegador). Há também um `supabase/schema.sql`
  pronto para plugar autenticação real do Supabase quando quiser

## Autenticação e administração de usuários

Para a demonstração, o cadastro/login/lista de usuários funciona totalmente offline,
salvo no `localStorage` do navegador (veja `lib/auth/local-db.ts`) — não precisa configurar
nada além do que já está no projeto.

- O **primeiro usuário cadastrado** em `/cadastro` vira administrador automaticamente.
- Administradores acessam `/admin` para:
  - promover ou remover o papel de administrador de outros usuários;
  - banir ou desbanir usuários (usuários banidos não conseguem mais entrar).
- As senhas nunca são salvas em texto puro (hash SHA-256).

Se quiser migrar para autenticação real do Supabase no futuro, execute
`supabase/schema.sql` no seu projeto — ele cria a tabela `profiles`, promove o
primeiro usuário a admin automaticamente e já vem com as políticas de RLS
necessárias.

## Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + RLS)
- Leaflet (mapa)
