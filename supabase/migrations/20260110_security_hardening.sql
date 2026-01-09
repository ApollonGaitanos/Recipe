-- SECURITY PATCH: Hardening RLS on recipe_signals
-- Issue: Previous policy "Signals are public" allowed full enumeration if not restricted.
-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Signals are public" ON recipe_signals;
-- 2. Create STRICT Public Policy (Anon / Everyone)
-- Only allow reading rows where is_public is explicitly TRUE
CREATE POLICY "Public signals are viewable" ON recipe_signals FOR
SELECT USING (is_public = true);
-- 3. Create PRIVATE Policy (Authenticated Owners)
-- Allow owners to see their own signals even if is_public = FALSE.
-- This requires a join with the 'recipes' table which holds the 'user_id'.
CREATE POLICY "Users can view own signals" ON recipe_signals FOR
SELECT USING (
        exists (
            select 1
            from recipes
            where recipes.id = recipe_signals.recipe_id
                and recipes.user_id = auth.uid()
        )
    );
-- 4. Double check RLS is enabled
ALTER TABLE recipe_signals ENABLE ROW LEVEL SECURITY;