-- SECURITY PATCH: Restore Authenticated Access (Owner Only)
-- Issue: Strict lockdown blocked Owners (and potentially Triggers/UI) from accessing `recipe_signals`.
-- Fix: Allow Authenticated users to manage their OWN signals via RLS.
-- 1. Restore Grants for Authenticated
GRANT ALL ON recipe_signals TO authenticated;
-- 2. Create Owner Policy (Strictly scoped to own recipes)
DROP POLICY IF EXISTS "Users can manage own signals" ON recipe_signals;
CREATE POLICY "Users can manage own signals" ON recipe_signals FOR ALL TO authenticated USING (
    exists (
        select 1
        from recipes
        where recipes.id = recipe_signals.recipe_id
            and recipes.user_id = auth.uid()
    )
);