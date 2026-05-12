
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_greeting boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  original_name text,
  caption text,
  created_at timestamptz not null default now()
);

create index media_album_idx on public.media(album_id);

alter table public.albums enable row level security;
alter table public.media enable row level security;

create policy "open albums" on public.albums for all using (true) with check (true);
create policy "open media" on public.media for all using (true) with check (true);

insert into storage.buckets (id, name, public) values ('aliancamedia', 'aliancamedia', true);

create policy "public read aliancamedia" on storage.objects for select using (bucket_id = 'aliancamedia');
create policy "public write aliancamedia" on storage.objects for insert with check (bucket_id = 'aliancamedia');
create policy "public update aliancamedia" on storage.objects for update using (bucket_id = 'aliancamedia');
create policy "public delete aliancamedia" on storage.objects for delete using (bucket_id = 'aliancamedia');

insert into public.albums (name, is_greeting, sort_order) values
  ('Bom dia', true, 0),
  ('Óculos', false, 1),
  ('Vídeos publicidade', false, 2),
  ('Fotos publicidade', false, 3);
