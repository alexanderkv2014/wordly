-- Пересоздаём таблицы words и stats под точную структуру приложения.
-- Безопасно: в них ещё нет данных (Этап B не был начат).

drop table if exists public.words;
drop table if exists public.stats;

create table public.words (
  user_id     uuid not null references auth.users(id) on delete cascade,
  id          text not null,
  en          text not null default '',
  ru          text not null default '',
  example     text not null default '',
  note        text not null default '',
  level       integer not null default 0,
  favorite    boolean not null default false,
  next_review bigint not null default 0,
  created_at  bigint not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  correct integer not null default 0,
  wrong   integer not null default 0,
  primary key (user_id, day)
);

alter table public.words enable row level security;
alter table public.stats enable row level security;

create policy "words_select_own" on public.words for select using (auth.uid() = user_id);
create policy "words_insert_own" on public.words for insert with check (auth.uid() = user_id);
create policy "words_update_own" on public.words for update using (auth.uid() = user_id);
create policy "words_delete_own" on public.words for delete using (auth.uid() = user_id);

create policy "stats_select_own" on public.stats for select using (auth.uid() = user_id);
create policy "stats_insert_own" on public.stats for insert with check (auth.uid() = user_id);
create policy "stats_update_own" on public.stats for update using (auth.uid() = user_id);
create policy "stats_delete_own" on public.stats for delete using (auth.uid() = user_id);
