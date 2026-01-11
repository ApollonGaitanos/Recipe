-- SECURITY PATCH: Restrict Profile Visibility
-- Issue: 'profiles' table was fully public. Future columns (e.g. email) would be exposed immediately.
-- Fix: Switch from Table-Level Select to Column-Level Select.
--      This defuses the "Time Bomb" by ensuring future columns are NOT visible by default.
-- 1. Revoke the broad Table-Level Select privilege
REVOKE
SELECT ON public.profiles
FROM anon,
    authenticated;
-- 2. Grant Column-Level Select ONLY for safe columns
-- Note: 'id', 'username', 'avatar_url', 'website' are currently safe to be public.
GRANT SELECT (id, username, avatar_url, website) ON public.profiles TO anon,
    authenticated;
-- 3. Ensure RLS is still enabled and permissive for ROWS (since we filter COLUMNS)
-- (Existing policy "Public profiles are viewable by everyone" using (true) is fine combined with Column Grants)
-- 4. Update/Harden Search Function
-- Function might exist with different return type, so drop it first.
DROP FUNCTION IF EXISTS public.search_profiles_public(text);
CREATE OR REPLACE FUNCTION public.search_profiles_public(search_term text) RETURNS TABLE(id uuid, username text, avatar_url text) LANGUAGE sql STABLE SECURITY DEFINER AS $$
select id,
    username,
    avatar_url
from public.profiles
where username ilike '%' || search_term || '%'
limit 10;
$$;