-- 將指定 email 帳號提升為 admin
-- 使用方法：在 Supabase SQL Editor 中將 'YOUR_EMAIL_HERE' 改為您父親的登入 email 後執行
--   select public.promote_to_admin('your_dad@example.com');

create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where email = target_email;
  if target_id is null then
    raise exception '找不到此 email 的使用者：%', target_email;
  end if;

  insert into public.profiles (id, role, display_name)
  values (target_id, 'admin', split_part(target_email, '@', 1))
  on conflict (id) do update set role = 'admin';
end;
$$;
