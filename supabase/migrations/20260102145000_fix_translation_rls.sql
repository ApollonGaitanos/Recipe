-- Allow users to delete translations if they own the recipe
drop policy if exists "Users can delete translations of their own recipes" on recipe_translations;
create policy "Users can delete translations of their own recipes"
  on recipe_translations for delete
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_translations.recipe_id
      and recipes.user_id = auth.uid()
    )
  );
