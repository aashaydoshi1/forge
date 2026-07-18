-- Public static assets for email confirmation landing (served without Edge Function CSP).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'forge-web',
  'forge-web',
  true,
  1048576,
  array['image/svg+xml', 'text/html', 'text/plain', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for forge-web objects
drop policy if exists "Public read forge-web" on storage.objects;
create policy "Public read forge-web"
  on storage.objects
  for select
  to public
  using (bucket_id = 'forge-web');
