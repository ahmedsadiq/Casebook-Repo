-- =============================================================
-- Storage bucket + policies for profile avatar uploads
-- =============================================================

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "storage: own profile avatar upload" on storage.objects;
create policy "storage: own profile avatar upload"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage: own profile avatar update" on storage.objects;
create policy "storage: own profile avatar update"
  on storage.objects for update
  using (
    bucket_id = 'profile-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage: own profile avatar delete" on storage.objects;
create policy "storage: own profile avatar delete"
  on storage.objects for delete
  using (
    bucket_id = 'profile-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
