-- Add star rating column (1-5, null = not rated yet)
alter table public."Pantagon_items"
add column if not exists rating smallint;

alter table public."Pantagon_items"
drop constraint if exists pantagon_items_rating_check;

alter table public."Pantagon_items"
add constraint pantagon_items_rating_check check (rating is null or (rating >= 1 and rating <= 5));
