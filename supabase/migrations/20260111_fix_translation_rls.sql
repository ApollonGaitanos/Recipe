-- SECURITY PATCH: Fix Broken Access Control on Translations
-- Issue: Previous policy allowed ANY authenticated user to insert translations for ANY recipe.
-- Fix: Restrict INSERT/UPDATE to the owner of the parent recipe.
-- 1. Drop the insecure policies
DROP POLICY IF EXISTS "Authenticated users can create translations" ON public.recipe_translations;
DROP POLICY IF EXISTS "Authenticated users can update translations" ON public.recipe_translations;
DROP POLICY IF EXISTS "Users can insert translations" ON public.recipe_translations;
-- Checking all potential names
-- 2. Create STRICT Insert Policy
-- Rule: You can only translate a recipe if you own it (user_id match).
CREATE POLICY "Owners can insert translations" ON public.recipe_translations FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id
            FROM public.recipes
            WHERE id = recipe_translations.recipe_id
        )
    );
-- 3. Create STRICT Update Policy
-- Rule: You can only update a translation if you own the parent recipe.
CREATE POLICY "Owners can update translations" ON public.recipe_translations FOR
UPDATE USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.recipes
            WHERE id = recipe_translations.recipe_id
        )
    );
-- 4. Delete Policy (Ensure this exists and is strict too)
-- If it doesn't default to owner-only, we should be explicit.
-- Assuming "Users can delete own translations" might allow deleting if they created it (via the old bad policy).
-- Let's ensure ONLY the Recipe Owner can delete.
DROP POLICY IF EXISTS "Authenticated users can delete translations" ON public.recipe_translations;
CREATE POLICY "Owners can delete translations" ON public.recipe_translations FOR DELETE USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.recipes
        WHERE id = recipe_translations.recipe_id
    )
);