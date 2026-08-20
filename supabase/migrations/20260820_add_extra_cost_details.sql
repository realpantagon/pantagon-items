-- Add dedicated JSON column for dynamic extra cost rows
alter table public."Pantagon_items"
add column if not exists extra_cost_details jsonb not null default '[]'::jsonb;

-- Migrate legacy embedded JSON block from note into extra_cost_details when present
update public."Pantagon_items"
set
  extra_cost_details = coalesce(
    (regexp_match(note, '\[extra-costs-json\](.*?)\[/extra-costs-json\]', 'gs'))[1]::jsonb,
    '[]'::jsonb
  ),
  note = nullif(
    btrim(regexp_replace(note, '\s*\[extra-costs-json\].*?\[/extra-costs-json\]\s*', '', 'gs')),
    ''
  )
where
  note is not null
  and note like '%[extra-costs-json]%'
  and extra_cost_details = '[]'::jsonb;

-- Keep data shape consistent
update public."Pantagon_items"
set extra_cost_details = '[]'::jsonb
where jsonb_typeof(extra_cost_details) <> 'array';
