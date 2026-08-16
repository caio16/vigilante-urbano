-- ============================================================================
-- Vigilante Urbano — schema de usuários (perfil, admin, banimento)
-- ============================================================================
-- Este arquivo é OPCIONAL: a aplicação já funciona 100% offline usando o
-- localStorage do navegador (veja lib/auth/local-db.ts), ideal para demonstrar
-- as funcionalidades sem depender de configuração externa.
--
-- Quando quiser usar autenticação REAL, rode este script no SQL Editor do seu
-- projeto Supabase. Ele cria uma tabela `profiles` ligada a `auth.users`
-- (o Supabase Auth já cuida de cadastro/login/senha), com papel (admin/user)
-- e status de banimento.
-- ============================================================================

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Qualquer usuário autenticado pode ver a lista de perfis (necessário para o
-- painel admin). Ajuste conforme sua necessidade de privacidade.
create policy "Perfis são visíveis para usuários autenticados"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Um usuário pode atualizar apenas seu próprio nome (não pode se
-- autopromover a admin nem se desbanir por aqui).
create policy "Usuário pode atualizar o próprio nome"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Apenas administradores podem alterar papel (role) e banimento de outros.
create policy "Admins podem gerenciar todos os perfis"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Cria automaticamente um perfil quando um novo usuário se cadastra pelo
-- Supabase Auth. O primeiro usuário criado vira admin automaticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 into is_first_user from public.profiles;

  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    case when is_first_user then 'admin' else 'user' end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Impede login de usuários banidos (verifique `banned` no lado da aplicação
-- após o login, já que o Supabase Auth não bloqueia login por si só).
-- Exemplo de checagem no client:
--   const { data } = await supabase.from('profiles').select('banned').eq('id', user.id).single()
--   if (data?.banned) { await supabase.auth.signOut(); throw new Error('Usuário banido') }
