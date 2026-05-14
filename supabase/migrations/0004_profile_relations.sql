-- 0004 : 讓 PostgREST 能透過 profiles(...) 內嵌語法 join 使用者資料
-- 把 comments / conversations / messages 的 user FK 改指向 public.profiles(id)
-- 由於 profiles.id 已 references auth.users(id) on delete cascade,
-- 刪除使用者的級聯行為仍然成立,語意完全等價。

-- comments
alter table public.comments
  drop constraint if exists comments_user_id_fkey;
alter table public.comments
  add constraint comments_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- conversations
alter table public.conversations
  drop constraint if exists conversations_guest_id_fkey;
alter table public.conversations
  add constraint conversations_guest_id_fkey
  foreign key (guest_id) references public.profiles(id) on delete cascade;

-- messages
alter table public.messages
  drop constraint if exists messages_sender_id_fkey;
alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id) references public.profiles(id) on delete cascade;

-- 通知 PostgREST 重新載入 schema cache,讓新關係立即生效
notify pgrst, 'reload schema';
