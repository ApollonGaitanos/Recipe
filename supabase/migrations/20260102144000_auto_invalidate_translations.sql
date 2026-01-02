-- Function to clean up translations on recipe update
create or replace function public.handle_recipe_update()
returns trigger as $$
begin
  -- When a recipe is updated, its old translations are likely invalid.
  -- Delete them so they can be regenerated on demand.
  delete from public.recipe_translations
  where recipe_id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to fire after update
create or replace trigger on_recipe_update
after update on public.recipes
for each row
execute function public.handle_recipe_update();
