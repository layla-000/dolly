-- Dolly Box v0.6 supplemental RLS setup
-- Run this once in Supabase SQL Editor after the schema/RLS you already created.

-- Make sure RLS is enabled on relation tables.
alter table public.doll_tags enable row level security;
alter table public.item_tags enable row level security;
alter table public.wishlist_tags enable row level security;

-- Relation-table policies: access only when the parent record belongs to the logged-in user.
drop policy if exists "Users manage own doll tags" on public.doll_tags;
create policy "Users manage own doll tags"
on public.doll_tags
for all
to authenticated
using (
  exists (
    select 1 from public.dolls d
    where d.id = doll_tags.doll_id
      and d.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.dolls d
    where d.id = doll_tags.doll_id
      and d.owner_id = (select auth.uid())
  )
);

drop policy if exists "Users manage own item tags" on public.item_tags;
create policy "Users manage own item tags"
on public.item_tags
for all
to authenticated
using (
  exists (
    select 1 from public.items i
    where i.id = item_tags.item_id
      and i.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.items i
    where i.id = item_tags.item_id
      and i.owner_id = (select auth.uid())
  )
);

drop policy if exists "Users manage own wishlist tags" on public.wishlist_tags;
create policy "Users manage own wishlist tags"
on public.wishlist_tags
for all
to authenticated
using (
  exists (
    select 1 from public.wishlist w
    where w.id = wishlist_tags.wishlist_id
      and w.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.wishlist w
    where w.id = wishlist_tags.wishlist_id
      and w.owner_id = (select auth.uid())
  )
);

-- Storage policies for private bucket `dolly-images`.
-- Folder structure is created automatically by the web app:
-- <auth.uid()>/dolls/<doll-id>/primary.webp
-- <auth.uid()>/items/<item-id>/primary.webp

drop policy if exists "Dolly Box users can view own images" on storage.objects;
create policy "Dolly Box users can view own images"
on storage.objects for select to authenticated
using (
  bucket_id = 'dolly-images'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Dolly Box users can upload own images" on storage.objects;
create policy "Dolly Box users can upload own images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'dolly-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Dolly Box users can update own images" on storage.objects;
create policy "Dolly Box users can update own images"
on storage.objects for update to authenticated
using (
  bucket_id = 'dolly-images'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'dolly-images'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Dolly Box users can delete own images" on storage.objects;
create policy "Dolly Box users can delete own images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'dolly-images'
  and owner_id = (select auth.uid()::text)
);

-- Optional but useful: enforce one primary image row per entity.
create unique index if not exists images_one_primary_per_entity
on public.images(entity_type, entity_id)
where is_primary = true;
