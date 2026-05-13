-- 0003 : 使用者禁言功能
-- 在 profiles 加入 is_banned / banned_reason 欄位，並更新 comments insert policy

-- 1. 新增欄位
alter table public.profiles
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_reason text;

-- 2. 更新 comments insert policy：被禁止的使用者不得新增留言
drop policy if exists "comments user insert" on public.comments;
create policy "comments user insert" on public.comments
for insert with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.is_banned = true
  )
);
