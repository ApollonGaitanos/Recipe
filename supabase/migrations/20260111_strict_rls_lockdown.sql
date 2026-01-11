-- SECURITY PATCH: Strict Lockdown of recipe_signals
-- Issue: Anonymous access to base table allowed structure enumeration.
-- Fix: Revoke all base table access and expose public data via Secure View.
-- 1. BASE TABLE LOCKDOWN
DROP POLICY IF EXISTS "public read public signals" ON recipe_signals;
ALTER TABLE recipe_signals ENABLE ROW LEVEL SECURITY;
-- Explicitly revoke inherited privileges if any
REVOKE ALL ON recipe_signals
FROM anon;
REVOKE ALL ON recipe_signals
FROM authenticated;
GRANT ALL ON recipe_signals TO service_role;
-- 2. SECURE VIEW IMPLEMENTATION
-- Expose ONLY recipe_id and updated_at for rows where is_public = true
DROP VIEW IF EXISTS public_recipe_signals;
CREATE VIEW public_recipe_signals AS
SELECT recipe_id,
    updated_at
FROM recipe_signals
WHERE is_public = true;
-- 3. GRANT ACCESS TO VIEW
GRANT SELECT ON public_recipe_signals TO anon;
GRANT SELECT ON public_recipe_signals TO authenticated;