-- Photobooth digital untuk tamu undangan.
--
-- Jalankan sekali di Supabase Dashboard -> SQL Editor. File ini sekaligus jadi
-- dokumentasi skema, karena proyek ini belum memakai folder migrasi.

-- 1. Tabel kenangan --------------------------------------------------------

create table if not exists photobooth_photos (
    id          uuid primary key default gen_random_uuid(),
    guest_name  text not null,
    image_url   text not null,
    frame_id    text not null,
    -- Disiapkan untuk fitur pesan suara yang menyusul; biarkan null untuk sekarang.
    voice_url   text,
    -- Moderasi dari dashboard: kenangan yang disembunyikan hilang dari galeri tamu.
    is_hidden   boolean not null default false,
    created_at  timestamptz not null default now()
);

create index if not exists photobooth_photos_created_at_idx
    on photobooth_photos (created_at desc);

alter table photobooth_photos enable row level security;

-- Tamu memakai anon key, jadi mereka boleh menitipkan kenangan...
drop policy if exists "guest insert" on photobooth_photos;
create policy "guest insert" on photobooth_photos
    for insert to anon with check (true);

-- ...dan melihat yang belum disembunyikan.
drop policy if exists "public select" on photobooth_photos;
create policy "public select" on photobooth_photos
    for select to anon using (is_hidden = false);

-- Sengaja TIDAK ada policy update/delete untuk anon. Keduanya hanya lewat
-- route handler server (app/api/photobooth/[id]) yang memakai service role key,
-- supaya tamu tidak bisa menghapus kenangan tamu lain.

-- 2. Bucket storage --------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photobooth', 'photobooth', true)
on conflict (id) do nothing;

drop policy if exists "photobooth guest upload" on storage.objects;
create policy "photobooth guest upload" on storage.objects
    for insert to anon with check (bucket_id = 'photobooth');

drop policy if exists "photobooth public read" on storage.objects;
create policy "photobooth public read" on storage.objects
    for select to anon using (bucket_id = 'photobooth');
