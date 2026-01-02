-- Add foreign key from recipes to profiles to enable PostgREST joins
-- Note: 'recipes' already has a FK to 'auth.users'. We are adding a second one to 'public.profiles'.
-- This tells PostgREST that it can join these two tables.

alter table public.recipes
add constraint recipes_profiles_fk
foreign key (user_id)
references public.profiles (id)
on delete cascade;
