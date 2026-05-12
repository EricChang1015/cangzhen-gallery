-- 藏珍閣 Supabase Schema
-- 安裝順序：在 Supabase SQL Editor 直接貼上執行即可。

-- =============================================================
-- 0. Extensions
-- =============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================
-- 1. Enums
-- =============================================================
do $$ begin
  create type public.user_role as enum ('admin', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_status as enum ('draft', 'published', 'reserved', 'sold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.comment_status as enum ('visible', 'hidden');
exception when duplicate_object then null; end $$;

-- =============================================================
-- 2. Tables
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  summary text,
  ai_description text,
  ai_generated_at timestamptz,
  dimensions text,
  weight text,
  era text,
  material text,
  provenance text,
  price_visible boolean not null default false,
  price text,
  status public.item_status not null default 'draft',
  cover_image_url text,
  view_count int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists items_status_idx on public.items(status);
create index if not exists items_category_idx on public.items(category_id);
create index if not exists items_published_at_idx on public.items(published_at desc);

create table if not exists public.item_images (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  url text not null,
  thumb_url text,
  storage_path text,
  alt_text text,
  sort_order int not null default 0,
  width int,
  height int,
  bytes int,
  created_at timestamptz not null default now()
);
create index if not exists item_images_item_idx on public.item_images(item_id, sort_order);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  status public.comment_status not null default 'visible',
  created_at timestamptz not null default now()
);
create index if not exists comments_item_idx on public.comments(item_id, created_at desc);

create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid not null references auth.users(id) on delete cascade,
  subject text,
  last_message_at timestamptz not null default now(),
  unread_for_admin int not null default 0,
  unread_for_guest int not null default 0,
  created_at timestamptz not null default now(),
  unique (guest_id)
);
create index if not exists conversations_guest_idx on public.conversations(guest_id);
create index if not exists conversations_last_msg_idx on public.conversations(last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role public.user_role not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- =============================================================
-- 3. Helper functions
-- =============================================================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'guest'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_items_updated on public.items;
create trigger trg_items_updated before update on public.items
for each row execute function public.touch_updated_at();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.touch_updated_at();

-- 訊息插入時自動更新 conversation 的 last_message_at + 未讀計數
create or replace function public.handle_new_message()
returns trigger language plpgsql as $$
begin
  update public.conversations c
  set last_message_at = new.created_at,
      unread_for_admin = case when new.sender_role = 'guest' then c.unread_for_admin + 1 else c.unread_for_admin end,
      unread_for_guest = case when new.sender_role = 'admin' then c.unread_for_guest + 1 else c.unread_for_guest end
  where c.id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_message_insert on public.messages;
create trigger trg_message_insert after insert on public.messages
for each row execute function public.handle_new_message();

-- =============================================================
-- 4. Row Level Security
-- =============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.item_images enable row level security;
alter table public.comments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.settings enable row level security;

-- profiles
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all" on public.profiles
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- categories : everyone can read; admin manages
drop policy if exists "categories read all" on public.categories;
create policy "categories read all" on public.categories for select using (true);

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- items : published 公開可讀；admin 全權
drop policy if exists "items public read" on public.items;
create policy "items public read" on public.items
for select using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "items admin write" on public.items;
create policy "items admin write" on public.items
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- item_images : published item 之圖可讀；admin 全權
drop policy if exists "item_images public read" on public.item_images;
create policy "item_images public read" on public.item_images
for select using (
  exists (
    select 1 from public.items i
    where i.id = item_id and (i.status = 'published' or public.is_admin(auth.uid()))
  )
);

drop policy if exists "item_images admin write" on public.item_images;
create policy "item_images admin write" on public.item_images
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- comments : visible 公開可讀；登入者可新增；admin 可審核
drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments
for select using (status = 'visible' or auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "comments user insert" on public.comments;
create policy "comments user insert" on public.comments
for insert with check (auth.uid() = user_id);

drop policy if exists "comments user update own" on public.comments;
create policy "comments user update own" on public.comments
for update using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "comments admin delete" on public.comments;
create policy "comments admin delete" on public.comments
for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- conversations : guest 只看自己；admin 看全部
drop policy if exists "conversations participant read" on public.conversations;
create policy "conversations participant read" on public.conversations
for select using (auth.uid() = guest_id or public.is_admin(auth.uid()));

drop policy if exists "conversations guest insert" on public.conversations;
create policy "conversations guest insert" on public.conversations
for insert with check (auth.uid() = guest_id);

drop policy if exists "conversations participant update" on public.conversations;
create policy "conversations participant update" on public.conversations
for update using (auth.uid() = guest_id or public.is_admin(auth.uid()))
with check (auth.uid() = guest_id or public.is_admin(auth.uid()));

-- messages : 訪客只看自己對話的；admin 看全部
drop policy if exists "messages participant read" on public.messages;
create policy "messages participant read" on public.messages
for select using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.guest_id = auth.uid()
  )
);

drop policy if exists "messages participant insert" on public.messages;
create policy "messages participant insert" on public.messages
for insert with check (
  auth.uid() = sender_id and (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.guest_id = auth.uid()
    )
  )
);

drop policy if exists "messages mark read" on public.messages;
create policy "messages mark read" on public.messages
for update using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.guest_id = auth.uid()
  )
);

-- settings : 公開可讀（前台需要 contact info、AI model 名等），但寫入限 admin
drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select using (true);

drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- =============================================================
-- 5. Storage Bucket
-- =============================================================
insert into storage.buckets (id, name, public)
values ('items', 'items', true)
on conflict (id) do nothing;

drop policy if exists "items storage public read" on storage.objects;
create policy "items storage public read" on storage.objects
for select using (bucket_id = 'items');

drop policy if exists "items storage admin write" on storage.objects;
create policy "items storage admin write" on storage.objects
for all using (bucket_id = 'items' and public.is_admin(auth.uid()))
with check (bucket_id = 'items' and public.is_admin(auth.uid()));

-- =============================================================
-- 6. Seed default categories & settings
-- =============================================================
insert into public.categories (slug, name, description, sort_order) values
  ('shoushan-stone', '壽山石', '福州壽山石章料、印石、雕件', 10),
  ('chicken-blood-stone', '雞血石', '昌化、巴林雞血石珍品', 20),
  ('jade', '玉石', '和闐玉、翡翠及各式美玉', 30),
  ('stone-carving', '石雕', '山子、擺件、文房石器', 40),
  ('wood-carving', '木雕', '黃花梨、紫檀及各類木雕', 50),
  ('calligraphy-painting', '字畫', '名家書法、水墨字畫', 60),
  ('porcelain', '瓷器', '官窯、民窯瓷器精品', 70),
  ('bronze', '銅器', '古銅器、銅雕、銅爐', 80),
  ('amber', '蜜蠟', '蜜蠟、琥珀、有機寶石', 90),
  ('others', '其他藝品', '其他古玩雅趣', 100)
on conflict (slug) do nothing;

insert into public.settings (key, value) values
  ('image_quality', to_jsonb(82)),
  ('image_max_size', to_jsonb(1920)),
  ('thumb_max_size', to_jsonb(600)),
  ('ai_model', to_jsonb('gpt-5.5'::text)),
  ('ai_enable_web_search', to_jsonb(true)),
  ('contact_phone', to_jsonb(''::text)),
  ('contact_line', to_jsonb(''::text)),
  ('contact_email', to_jsonb(''::text)),
  ('about_html', to_jsonb(''::text))
on conflict (key) do nothing;
