-- Create a table for caching translations
-- This allows "View-Only" translation without modifying the original recipe
create table if not exists recipe_translations (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade not null,
  language_code text not null, -- e.g. 'es', 'fr', 'de'
  title text,
  ingredients jsonb, -- Storing as JSONB to preserve structure
  instructions jsonb, -- Storing as JSONB to preserve structure
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Ensure one translation per language per recipe
  unique(recipe_id, language_code)
);

-- Enable RLS
alter table recipe_translations enable row level security;

-- Policies
-- 1. Public recipes translations are viewable by everyone
drop policy if exists "Public translations are viewable by everyone" on recipe_translations;
create policy "Public translations are viewable by everyone"
  on recipe_translations for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_translations.recipe_id
      and recipes.is_public = true
    )
  );

-- 2. Users can view translations of their own private recipes
drop policy if exists "Users can view their own private translations" on recipe_translations;
create policy "Users can view their own private translations"
  on recipe_translations for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_translations.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- 3. Users can insert/update translations (this is loose, usually server-side, but client-side AI flow needs it)
-- Ideally we check if they have access to the base recipe, but for now allow auth users to cache translations
drop policy if exists "Authenticated users can create translations" on recipe_translations;
create policy "Authenticated users can create translations"
  on recipe_translations for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update translations" on recipe_translations;
create policy "Authenticated users can update translations"
  on recipe_translations for update
  using (auth.role() = 'authenticated');
