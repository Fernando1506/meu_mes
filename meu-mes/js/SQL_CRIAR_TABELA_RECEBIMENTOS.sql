-- Tabela necessária para persistir o cadastro de recebimentos no Supabase.
-- Rode no SQL Editor do Supabase.

create table if not exists public.recebimentos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  nome text not null,
  tipo text not null default 'fixo',
  dia integer,
  valor_estimado numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recebimentos_workspace
  on public.recebimentos(workspace_id);

alter table public.recebimentos enable row level security;

-- Política simples baseada nos membros do workspace.
-- Ajuste se suas políticas de workspace tiverem outro nome/modelo.
drop policy if exists "recebimentos_select_workspace_members" on public.recebimentos;
create policy "recebimentos_select_workspace_members"
on public.recebimentos
for select
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = recebimentos.workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  )
  or exists (
    select 1
    from public.workspaces w
    where w.id = recebimentos.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists "recebimentos_insert_workspace_members" on public.recebimentos;
create policy "recebimentos_insert_workspace_members"
on public.recebimentos
for insert
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = recebimentos.workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  )
  or exists (
    select 1
    from public.workspaces w
    where w.id = recebimentos.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists "recebimentos_update_workspace_members" on public.recebimentos;
create policy "recebimentos_update_workspace_members"
on public.recebimentos
for update
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = recebimentos.workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  )
  or exists (
    select 1
    from public.workspaces w
    where w.id = recebimentos.workspace_id
      and w.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = recebimentos.workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  )
  or exists (
    select 1
    from public.workspaces w
    where w.id = recebimentos.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists "recebimentos_delete_workspace_members" on public.recebimentos;
create policy "recebimentos_delete_workspace_members"
on public.recebimentos
for delete
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = recebimentos.workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  )
  or exists (
    select 1
    from public.workspaces w
    where w.id = recebimentos.workspace_id
      and w.owner_id = auth.uid()
  )
);
